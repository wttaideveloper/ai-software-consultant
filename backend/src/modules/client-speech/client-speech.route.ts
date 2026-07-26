import { Router } from "express";
import { clientSpeechController } from "./client-speech.controller.js";
import { readAudioUpload } from "./client-speech.upload.js";

/**
 * POST /api/client/speech-to-text — public and unauthenticated, matching the rest
 * of the Client Portal.
 *
 * `readAudioUpload` runs first because the global `express.json()` never touches a
 * multipart body; this route needs the raw bytes, size-capped, before the
 * controller can see them.
 *
 * This endpoint spends money per call, so the service applies a per-IP window on
 * top of the format and size checks in the controller.
 */
export const clientSpeechRouter = Router();

clientSpeechRouter.post("/", readAudioUpload, clientSpeechController.transcribe);
