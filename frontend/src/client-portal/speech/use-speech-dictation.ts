import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  SPEECH_ERROR_MESSAGES,
  SPEECH_FALLBACK_ERROR,
  SPEECH_NO_SPEECH_ERROR,
  getSpeechRecognizerConstructor,
  isSpeechRecognitionSupported,
  type SpeechRecognizer,
} from "@/client-portal/speech/speech-recognition";

/**
 * Dictation into an existing text field, using the browser's native Web Speech
 * API. No backend call, no upload, no recording is ever created or kept — the
 * only thing that leaves this hook is recognised text handed to `onChange`.
 *
 * The field stays a normal controlled textarea throughout: there is no lock
 * state, so the user can type, delete or rewrite while the microphone is live.
 */

export type SpeechDictationStatus =
  | "idle"
  | "listening"
  | "processing"
  | "completed"
  | "error";

/** Hard cap on one dictation session, so an unattended tab can't hold the mic open. */
const MAX_LISTENING_MS = 120_000;
/** "Converting speech…" gets a floor so it reads as a step, not a flicker. */
const PROCESSING_MIN_MS = 550;
/** How long the success confirmation stays before falling back to idle. */
const COMPLETED_RESET_MS = 2_600;

type UseSpeechDictationOptions = {
  /** Current field value — the hook appends to whatever is in the box right now. */
  value: string;
  /** Receives the full next value. The caller stays the single owner of the text. */
  onChange: (next: string) => void;
};

/** Joins two fragments with exactly one space, never doubling existing whitespace. */
function appendFragment(base: string, addition: string): string {
  if (!addition) return base;
  if (!base) return addition;
  return /\s$/.test(base) ? base + addition : `${base} ${addition}`;
}

export function useSpeechDictation({ value, onChange }: UseSpeechDictationOptions) {
  const [isSupported] = useState(isSpeechRecognitionSupported);
  const [status, setStatus] = useState<SpeechDictationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  /** True only once the mic is actually capturing — the gap before it is the permission prompt. */
  const [isCapturing, setIsCapturing] = useState(false);

  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  /** The user's intent, which is what decides whether a browser-side `end` is a real stop. */
  const shouldListenRef = useRef(false);
  const capturedTextRef = useRef(false);
  const pendingErrorRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const stoppedAtRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const finalizeTimeoutRef = useRef<number | null>(null);
  const completedTimeoutRef = useRef<number | null>(null);

  /**
   * The exact tail we appended for the last interim hypothesis (separator
   * included). Interim text is provisional — it gets stripped and rewritten on
   * every event — while final text is committed and never touched again.
   */
  const pendingInterimRef = useRef("");
  const valueRef = useRef(value);
  const lastEmittedRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      // A change we didn't emit means the user edited the field themselves.
      // Whatever we had appended is now their text, so it must never be
      // rewritten by the next interim result.
      pendingInterimRef.current = "";
      lastEmittedRef.current = value;
    }
    valueRef.current = value;
  }, [value]);

  const clearTimer = useCallback((ref: RefObject<number | null>) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  const stopTicking = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const emit = useCallback((next: string) => {
    // Mirror the emission locally: two recognition events can land before React
    // re-renders, and the second must compose from the first, not from a stale prop.
    valueRef.current = next;
    lastEmittedRef.current = next;
    onChangeRef.current(next);
  }, []);

  const finalize = useCallback(() => {
    shouldListenRef.current = false;
    stopTicking();
    setIsCapturing(false);
    // Anything left in the box is the user's text from here on.
    pendingInterimRef.current = "";

    if (pendingErrorRef.current) {
      const message = pendingErrorRef.current;
      pendingErrorRef.current = null;
      setErrorMessage(message);
      setStatus("error");
      return;
    }

    if (!capturedTextRef.current) {
      setErrorMessage(SPEECH_NO_SPEECH_ERROR);
      setStatus("error");
      return;
    }

    setErrorMessage(null);
    setStatus("completed");
    completedTimeoutRef.current = window.setTimeout(() => {
      completedTimeoutRef.current = null;
      setStatus("idle");
    }, COMPLETED_RESET_MS);
  }, [stopTicking]);

  /** Keeps the "Converting speech…" state visible long enough to be read. */
  const finalizeAfterProcessing = useCallback(() => {
    const sinceStop = stoppedAtRef.current ? Date.now() - stoppedAtRef.current : PROCESSING_MIN_MS;
    const remaining = Math.max(0, PROCESSING_MIN_MS - sinceStop);
    stoppedAtRef.current = 0;

    if (remaining === 0) {
      finalize();
      return;
    }
    finalizeTimeoutRef.current = window.setTimeout(() => {
      finalizeTimeoutRef.current = null;
      finalize();
    }, remaining);
  }, [finalize]);

  const stop = useCallback(() => {
    if (!shouldListenRef.current) return;
    shouldListenRef.current = false;
    stoppedAtRef.current = Date.now();
    stopTicking();
    setStatus("processing");
    try {
      recognizerRef.current?.stop();
    } catch {
      // Already closed — settle from here instead of waiting for an `end` that won't come.
      finalizeAfterProcessing();
    }
  }, [finalizeAfterProcessing, stopTicking]);

  const start = useCallback(() => {
    const Recognizer = getSpeechRecognizerConstructor();
    if (!Recognizer || shouldListenRef.current) return;

    clearTimer(completedTimeoutRef);
    clearTimer(finalizeTimeoutRef);
    pendingErrorRef.current = null;
    pendingInterimRef.current = "";
    capturedTextRef.current = false;
    stoppedAtRef.current = 0;
    setErrorMessage(null);
    setElapsedSeconds(0);
    setIsCapturing(false);
    setStatus("listening");

    const recognizer = new Recognizer();
    recognizer.lang = navigator.language || "en-US";
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 1;

    recognizer.onaudiostart = () => setIsCapturing(true);

    recognizer.onresult = (event) => {
      let finalChunk = "";
      let interim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += transcript;
        } else {
          interim += transcript;
        }
      }

      // Drop the previous provisional tail, commit anything the engine settled
      // on, then re-append the current hypothesis.
      let base = valueRef.current;
      const previousInterim = pendingInterimRef.current;
      if (previousInterim && base.endsWith(previousInterim)) {
        base = base.slice(0, base.length - previousInterim.length);
      }

      const trimmedFinal = finalChunk.trim();
      if (trimmedFinal) {
        base = appendFragment(base, trimmedFinal);
      }

      const trimmedInterim = interim.trim();
      // Interim counts too: text is already in the box, so ending the session
      // with "we couldn't hear anything" would contradict what the user sees.
      if (trimmedFinal || trimmedInterim) {
        capturedTextRef.current = true;
      }

      const next = appendFragment(base, trimmedInterim);
      pendingInterimRef.current = next.slice(base.length);

      if (next !== valueRef.current) emit(next);
    };

    recognizer.onerror = (event) => {
      // We aborted it ourselves (unmount / restart) — not something to report.
      if (event.error === "aborted") return;
      // A pause in a continuous session also surfaces as `no-speech`; if we
      // already have words it's just silence, and `end` will restart us.
      if (event.error === "no-speech" && capturedTextRef.current) return;

      shouldListenRef.current = false;
      pendingErrorRef.current = SPEECH_ERROR_MESSAGES[event.error] ?? SPEECH_FALLBACK_ERROR;
    };

    recognizer.onend = () => {
      // Chrome ends the session on its own after a stretch of silence. While the
      // user still intends to dictate, restart so thinking out loud doesn't end
      // the recording — bounded by the hard cap.
      if (shouldListenRef.current && Date.now() - startedAtRef.current < MAX_LISTENING_MS) {
        try {
          // A new session restarts result indexing, so treat everything already
          // in the field as committed — nothing from it may be rewritten.
          pendingInterimRef.current = "";
          recognizer.start();
          return;
        } catch {
          // Fall through: the engine refused to restart, so settle the session.
        }
      }
      finalizeAfterProcessing();
    };

    recognizerRef.current = recognizer;
    shouldListenRef.current = true;
    startedAtRef.current = Date.now();

    try {
      recognizer.start();
    } catch {
      shouldListenRef.current = false;
      setErrorMessage(SPEECH_FALLBACK_ERROR);
      setStatus("error");
      return;
    }

    tickRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedSeconds(Math.floor(elapsed / 1_000));
      if (elapsed >= MAX_LISTENING_MS) stop();
    }, 1_000);
  }, [clearTimer, emit, finalizeAfterProcessing, stop]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  const toggle = useCallback(() => {
    if (shouldListenRef.current) {
      stop();
      return;
    }
    start();
  }, [start, stop]);

  // Leaving the step must release the microphone immediately.
  useEffect(
    () => () => {
      shouldListenRef.current = false;
      stopTicking();
      if (finalizeTimeoutRef.current !== null) window.clearTimeout(finalizeTimeoutRef.current);
      if (completedTimeoutRef.current !== null) window.clearTimeout(completedTimeoutRef.current);

      const recognizer = recognizerRef.current;
      if (!recognizer) return;
      recognizer.onresult = null;
      recognizer.onerror = null;
      recognizer.onend = null;
      recognizer.onaudiostart = null;
      try {
        recognizer.abort();
      } catch {
        // Nothing to abort — the session had already closed.
      }
      recognizerRef.current = null;
    },
    [stopTicking],
  );

  return {
    isSupported,
    status,
    isListening: status === "listening",
    isCapturing,
    elapsedSeconds,
    errorMessage,
    start,
    stop,
    toggle,
    dismissError,
  };
}
