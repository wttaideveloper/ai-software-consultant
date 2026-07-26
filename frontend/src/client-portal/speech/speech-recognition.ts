/**
 * Web Speech API access layer — Client Portal only.
 *
 * Everything here runs in the browser: `SpeechRecognition` is a native browser
 * capability, so there is no SDK, no API key, no network call of our own and no
 * audio ever leaves the page through our code. Nothing in this module imports
 * from `services/` and nothing here can reach the backend.
 *
 * The interfaces below are declared **locally** rather than as a global
 * `declare global` augmentation. `SpeechRecognition` is still a draft spec and
 * whether TypeScript's DOM lib ships it varies by version — module-scoped types
 * compile identically either way and can never collide with a future lib update.
 */

export type SpeechAlternative = {
  readonly transcript: string;
  readonly confidence: number;
};

export type SpeechResult = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechAlternative;
};

export type SpeechResultList = {
  readonly length: number;
  readonly [index: number]: SpeechResult;
};

export type SpeechResultEvent = {
  /** Index of the first result that changed — everything before it is settled. */
  readonly resultIndex: number;
  readonly results: SpeechResultList;
};

export type SpeechErrorEvent = {
  readonly error: string;
  readonly message?: string;
};

export type SpeechRecognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognizerConstructor = new () => SpeechRecognizer;

type SpeechCapableWindow = {
  SpeechRecognition?: SpeechRecognizerConstructor;
  webkitSpeechRecognition?: SpeechRecognizerConstructor;
};

/**
 * Chrome/Edge/Brave expose the vendor-prefixed constructor; the unprefixed one
 * is the standardised name. The double cast goes through `unknown` so this stays
 * correct whether or not lib.dom declares a (differently shaped) global.
 */
export function getSpeechRecognizerConstructor(): SpeechRecognizerConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate = window as unknown as SpeechCapableWindow;
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

/**
 * The API is gated on a secure context. Over plain http (a LAN dev host, say)
 * the constructor still exists but `start()` fails with `not-allowed`, so an
 * insecure page counts as unsupported and the microphone affordance is hidden
 * rather than shown broken.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (getSpeechRecognizerConstructor() === null) return false;
  return typeof window !== "undefined" && window.isSecureContext !== false;
}

export const SPEECH_NO_SPEECH_ERROR = "We couldn't hear anything. Please try again.";

export const SPEECH_FALLBACK_ERROR =
  "The microphone stopped unexpectedly. Please try again, or type your idea above.";

/** Friendly, non-technical copy for every error code the spec defines. */
export const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  "no-speech": SPEECH_NO_SPEECH_ERROR,
  "audio-capture":
    "We couldn't find a microphone. Check that one is connected, then try again.",
  "not-allowed":
    "Microphone access is blocked. Allow it in your browser settings, then try again.",
  "service-not-allowed":
    "Your browser blocked speech recognition. You can still type your idea above.",
  network:
    "Speech recognition needs an internet connection. Check your network and try again.",
  "language-not-supported":
    "Your language isn't supported for speech yet — please type your idea above.",
};
