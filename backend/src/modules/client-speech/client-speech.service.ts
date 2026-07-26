import { config } from "../../config/env.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { SlidingWindowCounter } from "../../shared/rate-limit/sliding-window.js";
import { openAIProvider } from "../ai/providers/openai.provider.js";
import {
  toSpeechTranscriptionDto,
  type SpeechTranscriptionDto,
} from "./client-speech.dto.js";

/**
 * Speech-to-text for the public Client Portal.
 *
 * **Stateless by design — there is no repository and no table.** Like the rest of
 * the `client-*` modules there is no authenticated visitor, organization or
 * consultation to key anything on (both would be NOT NULL FKs), which is also why
 * no `ai_generations` audit row is written here — the same trade-off
 * client-requirements.service.ts documents.
 *
 * Nothing about the consultation pipeline runs through this module: it converts
 * audio to text and returns it. The text then travels the exact path typed text
 * always has.
 */

const ONE_HOUR_MS = 60 * 60 * 1_000;

export type TranscribeAudioInput = {
  body: Buffer;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
};

export type TranscribeAudioContext = {
  ipAddress: string | null;
};

export class ClientSpeechService {
  /**
   * Outermost, weakest guard on a public billable endpoint — per-process, so it
   * multiplies by instance count (see SlidingWindowCounter). The real limits are
   * the byte cap and the duration cap, both enforced before the provider call.
   */
  private readonly rateLimiter = new SlidingWindowCounter(
    ONE_HOUR_MS,
    config.SPEECH_RATE_LIMIT_PER_HOUR,
  );

  async transcribe(
    input: TranscribeAudioInput,
    context: TranscribeAudioContext,
  ): Promise<SpeechTranscriptionDto> {
    if (context.ipAddress && !this.rateLimiter.tryConsume(context.ipAddress)) {
      throw new AppError(
        "Too many voice requests. Please wait a moment and try again.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }

    const result = await openAIProvider.transcribeAudio({
      body: input.body,
      filename: input.filename,
      mimeType: input.mimeType,
      model: config.OPENAI_WHISPER_MODEL,
      timeoutMs: config.OPENAI_WHISPER_TIMEOUT_MS,
    });

    const text = result.text.trim();

    // Silence, background noise, or a muted microphone all land here.
    if (!text) {
      throw new AppError(
        "We couldn't make out any words in that recording. Please try again.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Size and latency only — the transcript is the visitor's own words and is
    // never written to the logs.
    logger.info(
      `Speech transcribed: ${input.sizeBytes} bytes, ${
        input.durationSeconds ?? "unknown"
      }s, ${result.metadata.latencyMs ?? 0}ms`,
    );

    return toSpeechTranscriptionDto(text);
  }
}

export const clientSpeechService = new ClientSpeechService();
