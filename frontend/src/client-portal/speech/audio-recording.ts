/**
 * Browser audio-capture capabilities for the Client Portal's voice input.
 *
 * This replaced the Web Speech API layer: recognition now happens server-side
 * through OpenAI, so the browser's only job is to capture bytes. That trade is
 * deliberate — `SpeechRecognition` was free but Chrome-family only and markedly
 * less accurate on accents, product names and technical vocabulary, which is
 * exactly the language a project brief is made of.
 */

/** Hard client-side cap. The server enforces its own; this one keeps files small. */
export const MAX_RECORDING_SECONDS = 120;

/**
 * Ordered by preference. Opus in WebM is small and well-supported across
 * Chrome/Edge/Brave/Firefox; Safari only offers MP4/AAC. An empty result means
 * the browser gets to choose, which is still valid input for the API.
 */
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
];

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "video/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

/**
 * Recording needs `MediaRecorder`, `getUserMedia` **and** a secure context —
 * `navigator.mediaDevices` is simply undefined on an insecure origin, so this
 * also covers the http case rather than letting it fail at click time.
 */
export function isAudioRecordingSupported(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return (
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    window.isSecureContext !== false
  );
}

export function pickRecordingMimeType(): string | undefined {
  if (typeof window.MediaRecorder?.isTypeSupported !== "function") {
    return undefined;
  }

  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/** `audio/webm;codecs=opus` → `webm`. The API infers format from the extension. */
export function fileExtensionForMimeType(mimeType: string): string {
  const base = (mimeType.split(";")[0] ?? "").trim().toLowerCase();
  return MIME_TYPE_EXTENSIONS[base] ?? "webm";
}

/** Friendly copy for every way `getUserMedia` and `MediaRecorder` can fail. */
export function describeRecorderError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Microphone access is blocked. Allow it in your browser settings, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "We couldn't find a microphone. Check that one is connected, then try again.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your microphone is being used by another app. Close it and try again.";
    case "OverconstrainedError":
      return "We couldn't start your microphone. Try selecting a different input device.";
    case "AbortError":
      return "Recording stopped unexpectedly. Please try again.";
    default:
      return "We couldn't start recording. Please try again, or type your idea above.";
  }
}
