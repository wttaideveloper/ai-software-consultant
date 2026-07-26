import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "../../config/env.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import {
  normalizeMimeType,
  resolveAudioExtension,
} from "./client-speech.validation.js";

/**
 * Multipart handling for the one endpoint in the app that accepts a file.
 *
 * **No multipart dependency.** Node's built-in `Response.formData()` (undici)
 * parses `multipart/form-data` natively, so a ~40-line helper replaces multer
 * and its dependency tree for a single route — the same call this codebase
 * already made for rate limiting (see shared/rate-limit/sliding-window.ts).
 *
 * **Nothing touches disk.** The body is buffered in memory, bounded by
 * SPEECH_MAX_UPLOAD_BYTES, handed to the provider, and dropped. There is no
 * temp directory, no stream to a file, and therefore no cleanup step that could
 * be skipped or fail — the only way audio persists is if code is added to
 * persist it.
 */

/** Multipart framing overhead on top of the audio itself (headers, boundaries). */
const MULTIPART_OVERHEAD_BYTES = 64 * 1_024;

export type ParsedAudioUpload = {
  body: Buffer;
  /** Rebuilt from the MIME type — the browser's own `blob` name is useless to the provider. */
  filename: string;
  /** Lower-cased, parameters stripped. */
  mimeType: string;
  sizeBytes: number;
  /** Client-declared. Sanity-checked, never trusted as a measurement. */
  durationSeconds: number | null;
};

const rawMultipartBody = express.raw({
  type: "multipart/form-data",
  limit: config.SPEECH_MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES,
});

/**
 * Buffers the request body, converting body-parser's own failures into operational
 * AppErrors — otherwise an oversized upload surfaces as a generic 500 instead of
 * telling the visitor their recording was too long.
 */
export function readAudioUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  rawMultipartBody(req, res, (error?: unknown) => {
    if (!error) {
      next();
      return;
    }

    const status = (error as { status?: number; statusCode?: number }).status;

    if (status === HTTP_STATUS.PAYLOAD_TOO_LARGE) {
      next(
        new AppError(
          "That recording is too large. Please record a shorter clip.",
          HTTP_STATUS.PAYLOAD_TOO_LARGE,
        ),
      );
      return;
    }

    next(
      new AppError(
        "We couldn't read that audio upload. Please try again.",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
  });
}

export async function extractAudioUpload(req: Request): Promise<ParsedAudioUpload> {
  const contentType = req.headers["content-type"];

  if (!contentType || !contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new AppError(
      "Audio must be uploaded as multipart/form-data.",
      HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
    );
  }

  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new AppError("No audio was uploaded.", HTTP_STATUS.BAD_REQUEST);
  }

  let form: FormData;

  try {
    // Copied into a standalone ArrayBuffer rather than viewing `body.buffer`:
    // Buffer instances can be slices of a shared pool, so the underlying buffer
    // is not necessarily this request's bytes alone.
    const bytes = new Uint8Array(req.body);

    form = await new Response(bytes, {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new AppError(
      "We couldn't read that audio upload. Please try again.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const audio = form.get("audio");

  if (!(audio instanceof File)) {
    throw new AppError(
      "No audio file was uploaded under the `audio` field.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const mimeType = normalizeMimeType(audio.type);
  const body = Buffer.from(await audio.arrayBuffer());

  return {
    body,
    // The provider sniffs the container from the extension, so the name is
    // derived from the validated MIME type rather than echoing client input
    // (which would otherwise be a path-traversal shaped value we hand onward).
    filename: `recording.${resolveAudioExtension(mimeType)}`,
    mimeType,
    sizeBytes: body.byteLength,
    durationSeconds: parseDuration(form.get("durationSeconds")),
  };
}

function parseDuration(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
