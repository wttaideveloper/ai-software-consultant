import { isAxiosError } from "axios";
import { api } from "@/services/api";
import { fileExtensionForMimeType } from "@/client-portal/speech/audio-recording";
import { getApiErrorMessage } from "@/utils/api-error";
import type { ApiSuccessResponse } from "@/types";

/**
 * Public, unauthenticated Client Portal endpoint — the audio is transcribed by
 * OpenAI server-side and the bytes are discarded with the request. Nothing is
 * stored, so there is no id to fetch and no resource to clean up afterwards.
 */

/**
 * Comfortably longer than the server's own OPENAI_WHISPER_TIMEOUT_MS (120s), so
 * a slow transcription surfaces the backend's friendly message rather than the
 * client giving up first and reporting a generic network failure.
 */
export const SPEECH_REQUEST_TIMEOUT_MS = 150_000;

export type TranscribeAudioOptions = {
  durationSeconds: number;
  /** Fires once the bytes are on the wire — everything after this is the AI, not the network. */
  onUploadComplete?: () => void;
  signal?: AbortSignal;
};

export const clientSpeechService = {
  async transcribe(
    audio: Blob,
    { durationSeconds, onUploadComplete, signal }: TranscribeAudioOptions,
  ): Promise<string> {
    const form = new FormData();
    form.append("audio", audio, `recording.${fileExtensionForMimeType(audio.type)}`);
    form.append("durationSeconds", String(Math.round(durationSeconds)));

    let uploadNotified = false;

    const response = await api.post<ApiSuccessResponse<{ text: string }>>(
      "/api/client/speech-to-text",
      form,
      {
        // Load-bearing, not decorative: the `api` instance defaults to
        // `application/json`, and axios *serialises FormData to JSON* when it
        // sees a JSON content type — the audio would silently never be sent.
        // Declaring multipart without a boundary makes axios hand the header
        // back to the browser, which fills the boundary in.
        headers: { "Content-Type": "multipart/form-data" },
        timeout: SPEECH_REQUEST_TIMEOUT_MS,
        signal,
        onUploadProgress: (event) => {
          if (uploadNotified) return;
          if (event.total && event.loaded < event.total) return;
          uploadNotified = true;
          onUploadComplete?.();
        },
      },
    );

    return response.data.data.text;
  },
};

/**
 * Turns a failed transcription into something a non-technical visitor can act
 * on. Server-side messages are already written for this audience, so they are
 * passed through; only the failures that never reached the server need copy.
 */
export function describeTranscriptionError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "That took longer than expected. Please try a shorter recording.";
    }

    if (!error.response) {
      return "We couldn't reach the server. Check your connection and try again.";
    }
  }

  return getApiErrorMessage(
    error,
    "We couldn't convert that recording. Please try again, or type your idea above.",
  );
}
