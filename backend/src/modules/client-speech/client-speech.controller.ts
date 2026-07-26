import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getClientIp } from "../../shared/http/get-client-ip.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientSpeechService } from "./client-speech.service.js";
import { extractAudioUpload } from "./client-speech.upload.js";
import { speechUploadSchema } from "./client-speech.validation.js";

function parseOrThrow<T>(
  result:
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ message?: string }> } },
): T {
  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message ?? "Validation failed",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return result.data;
}

export class ClientSpeechController {
  /**
   * Every rejection happens before the provider call, so an invalid upload costs
   * nothing: the format allowlist, the byte cap and the declared duration are all
   * checked first.
   */
  transcribe = asyncHandler(async (req: Request, res: Response) => {
    const upload = await extractAudioUpload(req);

    parseOrThrow(
      speechUploadSchema.safeParse({
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        durationSeconds: upload.durationSeconds,
      }),
    );

    const result = await clientSpeechService.transcribe(upload, {
      ipAddress: getClientIp(req),
    });

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Audio transcribed successfully.", result));
  });
}

export const clientSpeechController = new ClientSpeechController();
