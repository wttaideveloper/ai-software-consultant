import { z } from "zod";
import { config } from "../../config/env.js";

/**
 * Containers a browser `MediaRecorder` actually produces, intersected with what
 * the transcription API accepts. Anything outside this list is rejected before a
 * byte reaches OpenAI — an allowlist, never a denylist.
 *
 * `video/webm` and `video/mp4` are here on purpose: some browsers label an
 * audio-only recording with the video container's type, and rejecting those
 * would break Chrome and Safari for no security gain.
 */
export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/m4a",
  "audio/x-m4a",
  "audio/flac",
  "video/webm",
  "video/mp4",
] as const;

/**
 * The API infers the audio format from the filename extension, so an upload
 * named `blob` transcribes as nothing. Every allowed type maps to an extension
 * the provider recognises.
 */
const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "video/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/mpga": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
};

/** `audio/webm;codecs=opus` → `audio/webm`. Parameters are never part of the check. */
export function normalizeMimeType(value: string): string {
  return (value.split(";")[0] ?? "").trim().toLowerCase();
}

export function isAllowedAudioMimeType(value: string): boolean {
  return (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(value);
}

export function resolveAudioExtension(mimeType: string): string {
  return MIME_TYPE_EXTENSIONS[mimeType] ?? "webm";
}

const megabytes = (bytes: number) => Math.round(bytes / 1_048_576);

/**
 * Validates the *descriptor* of the upload, not its bytes. The byte cap is the
 * enforceable limit; `durationSeconds` is declared by the browser and can be
 * anything, so it is a sanity check that costs nothing rather than a guarantee.
 */
export const speechUploadSchema = z.object({
  mimeType: z
    .string()
    .refine(isAllowedAudioMimeType, "That audio format isn't supported. Please try again."),
  sizeBytes: z
    .number()
    .int()
    .positive("The recording came through empty. Please try again.")
    .max(
      config.SPEECH_MAX_UPLOAD_BYTES,
      `That recording is too large (limit ${megabytes(config.SPEECH_MAX_UPLOAD_BYTES)} MB). Please record a shorter clip.`,
    ),
  durationSeconds: z
    .number()
    .min(0)
    .max(
      config.SPEECH_MAX_DURATION_SECONDS,
      `Recordings are limited to ${config.SPEECH_MAX_DURATION_SECONDS} seconds.`,
    )
    .nullable(),
});

export type SpeechUploadInput = z.infer<typeof speechUploadSchema>;
