import { useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_RECORDING_SECONDS,
  describeRecorderError,
  isAudioRecordingSupported,
  pickRecordingMimeType,
} from "@/client-portal/speech/audio-recording";
import { startMicLevelMeter } from "@/client-portal/speech/mic-level-meter";
import {
  clientSpeechService,
  describeTranscriptionError,
} from "@/services/client-speech.service";

/**
 * Dictation into an existing text field, transcribed by OpenAI.
 *
 * The browser records; the server transcribes. Audio lives in memory as a Blob
 * for the length of one upload and is never written anywhere — no object URL, no
 * IndexedDB, no download. The microphone track is released the instant recording
 * stops, before the upload even starts, so the browser's recording indicator
 * goes out immediately rather than lingering through transcription.
 *
 * The field stays a normal controlled textarea throughout: the transcript is
 * *appended* to whatever is already there, and the user can edit it freely
 * before, during and after.
 */

export type SpeechDictationStatus =
  | "idle"
  | "recording"
  | "uploading"
  | "transcribing"
  | "completed"
  | "error";

/** How long the success confirmation stays before falling back to idle. */
const COMPLETED_RESET_MS = 2_600;

type UseSpeechDictationOptions = {
  /** Current field value — the transcript is appended to whatever is in the box. */
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
  const [isSupported] = useState(isAudioRecordingSupported);
  const reduce = useReducedMotion();

  const [status, setStatus] = useState<SpeechDictationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  /** True only once the recorder is actually running — the gap before it is the permission prompt. */
  const [isCapturing, setIsCapturing] = useState(false);

  /** Live input level (0–1). A MotionValue so metering never re-renders React. */
  const audioLevel = useMotionValue(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopMeterRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef<number | null>(null);
  const completedTimeoutRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  /**
   * Why the pending recording must be thrown away instead of uploaded. The
   * *reason* matters, not just the fact: a recorder error already put a message
   * on screen, so the `stop` that follows it must not reset the panel to idle
   * and erase it.
   */
  const discardRef = useRef<"cancel" | "error" | "unmount" | null>(null);
  const startingRef = useRef(false);
  const unmountedRef = useRef(false);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const stopTicking = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stopMeter = useCallback(() => {
    stopMeterRef.current?.();
    stopMeterRef.current = null;
  }, []);

  /** Ends the capture tracks — this is what turns the browser's mic indicator off. */
  const releaseMicrophone = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const fail = useCallback((message: string) => {
    setErrorMessage(message);
    setStatus("error");
  }, []);

  const succeed = useCallback(() => {
    setErrorMessage(null);
    setStatus("completed");
    completedTimeoutRef.current = window.setTimeout(() => {
      completedTimeoutRef.current = null;
      setStatus("idle");
    }, COMPLETED_RESET_MS);
  }, []);

  /**
   * Runs after MediaRecorder has flushed its final chunk: tear down capture
   * first, then upload. Nothing here can run twice for one recording — the
   * recorder fires `stop` exactly once.
   */
  const handleRecordingStopped = useCallback(
    async (recordedMimeType: string) => {
      stopTicking();
      stopMeter();
      releaseMicrophone();
      setIsCapturing(false);
      recorderRef.current = null;

      const chunks = chunksRef.current;
      chunksRef.current = [];

      // Cancelled, failed or unmounted: the bytes are dropped without ever being sent.
      const discardReason = discardRef.current;
      if (discardReason) {
        discardRef.current = null;
        // Only an explicit cancel returns to idle — "error" has already shown a
        // message, and "unmount" has no component left to update.
        if (discardReason === "cancel" && !unmountedRef.current) setStatus("idle");
        return;
      }

      const durationSeconds = (Date.now() - startedAtRef.current) / 1_000;
      const blob = new Blob(chunks, { type: recordedMimeType || "audio/webm" });

      if (blob.size === 0) {
        fail("We didn't catch any audio. Please check your microphone and try again.");
        return;
      }

      setStatus("uploading");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const text = await clientSpeechService.transcribe(blob, {
          durationSeconds,
          signal: controller.signal,
          onUploadComplete: () => {
            if (!controller.signal.aborted) setStatus("transcribing");
          },
        });

        const transcript = text.trim();

        if (!transcript) {
          fail("We couldn't make out any words in that recording. Please try again.");
          return;
        }

        const next = appendFragment(valueRef.current, transcript);
        valueRef.current = next;
        onChangeRef.current(next);
        succeed();
      } catch (error) {
        // Aborted by unmount — the component is gone, so there is no state worth setting.
        if (controller.signal.aborted) return;
        fail(describeTranscriptionError(error));
      } finally {
        abortRef.current = null;
      }
    },
    [fail, releaseMicrophone, stopMeter, stopTicking, succeed],
  );

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    // Flushes a final chunk, then fires `stop` → handleRecordingStopped.
    recorder.stop();
  }, []);

  const cancel = useCallback(() => {
    discardRef.current = "cancel";

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    stopTicking();
    stopMeter();
    releaseMicrophone();
    setIsCapturing(false);
    setStatus("idle");
  }, [releaseMicrophone, stopMeter, stopTicking]);

  const start = useCallback(async () => {
    if (!isAudioRecordingSupported() || startingRef.current || recorderRef.current) {
      return;
    }

    startingRef.current = true;

    if (completedTimeoutRef.current !== null) {
      window.clearTimeout(completedTimeoutRef.current);
      completedTimeoutRef.current = null;
    }

    discardRef.current = null;
    chunksRef.current = [];
    setErrorMessage(null);
    setElapsedSeconds(0);
    setIsCapturing(false);
    setStatus("recording");

    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      startingRef.current = false;
      if (!unmountedRef.current) fail(describeRecorderError(error));
      return;
    }

    // Cancelled or unmounted while the permission prompt was open. The page stays
    // interactive behind that prompt, so this is reachable — without it, granting
    // permission after pressing Cancel would start a recording nobody asked for.
    if (unmountedRef.current || discardRef.current === "cancel") {
      stream.getTracks().forEach((track) => track.stop());
      discardRef.current = null;
      startingRef.current = false;
      return;
    }

    streamRef.current = stream;

    let recorder: MediaRecorder;

    try {
      const mimeType = pickRecordingMimeType();
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (error) {
      releaseMicrophone();
      startingRef.current = false;
      fail(describeRecorderError(error));
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onerror = () => {
      discardRef.current = "error";
      fail("Recording stopped unexpectedly. Please try again.");
    };

    recorder.onstop = () => {
      void handleRecordingStopped(recorder.mimeType);
    };

    // A timeslice keeps chunks flowing rather than buffering one large blob at
    // the end, which is what makes a long recording survive a tab hiccup.
    recorder.start(1_000);

    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    startingRef.current = false;
    setIsCapturing(true);

    if (!reduce) {
      stopMeterRef.current = startMicLevelMeter(stream, audioLevel);
    }

    tickRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1_000);
      setElapsedSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) stop();
    }, 1_000);
  }, [audioLevel, fail, handleRecordingStopped, reduce, releaseMicrophone, stop]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  // Leaving the step must release the microphone and drop any pending upload.
  useEffect(
    () => () => {
      unmountedRef.current = true;
      discardRef.current = "unmount";

      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      abortRef.current?.abort();
      stopMeterRef.current?.();
      stopMeterRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (tickRef.current !== null) window.clearInterval(tickRef.current);
      if (completedTimeoutRef.current !== null) {
        window.clearTimeout(completedTimeoutRef.current);
      }
    },
    [],
  );

  return {
    isSupported,
    status,
    isRecording: status === "recording",
    isCapturing,
    elapsedSeconds,
    maxSeconds: MAX_RECORDING_SECONDS,
    errorMessage,
    audioLevel,
    start,
    stop,
    cancel,
    dismissError,
  };
}
