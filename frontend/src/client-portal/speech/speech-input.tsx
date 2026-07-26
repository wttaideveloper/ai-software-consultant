import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, Mic, Sparkles, Square } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { SpeechWaveform } from "@/client-portal/speech/speech-waveform";
import { useSpeechDictation } from "@/client-portal/speech/use-speech-dictation";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

/**
 * "Speak your idea" — the typing alternative offered under a Client Portal
 * textarea. Non-technical clients describe a project far more easily out loud
 * than in writing, so this is a first-class second path into the same field,
 * not an afterthought.
 *
 * It is deliberately *additive*: the textarea stays exactly as it was, remains
 * fully editable while the microphone is live, and the value it produces flows
 * through the caller's existing `onChange`. Nothing about the submitted payload
 * or the AI flow downstream changes.
 *
 * On a browser without the Web Speech API (Safari/Firefox today) the whole
 * block renders nothing at all, leaving a plain, unbroken typing experience.
 */

type SpeechInputProps = {
  /** The field's current value — dictation appends to it. */
  value: string;
  /** Receives the full next value, same contract as the textarea's own onChange. */
  onChange: (next: string) => void;
  /** Optional field to keep pinned to its newest line as words stream in. */
  scrollTargetRef?: RefObject<HTMLTextAreaElement | null>;
  /** Copy on the idle button. */
  idleLabel?: string;
  /** Sub-label shown while listening. */
  listeningHint?: string;
  className?: string;
};

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const panelBase =
  "flex flex-wrap items-center gap-x-3 gap-y-3 rounded-xl border px-4 py-3";

export function SpeechInput({
  value,
  onChange,
  scrollTargetRef,
  idleLabel = "Speak your idea",
  listeningHint = "Speak naturally — your words appear in the box above.",
  className,
}: SpeechInputProps) {
  const reduce = useReducedMotion();

  const {
    isSupported,
    status,
    isCapturing,
    elapsedSeconds,
    errorMessage,
    start,
    stop,
    dismissError,
  } = useSpeechDictation({
    value,
    onChange: (next) => {
      onChange(next);
      // Follow the transcript down after React has painted it, so long
      // dictations don't disappear above the fold.
      const element = scrollTargetRef?.current;
      if (!element) return;
      window.requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    },
  });

  const isListening = status === "listening";

  // One polite live region for the whole control: screen readers get the state
  // changes without the timer chattering once a second. Errors are announced by
  // the error panel's own role="alert" instead.
  const announcement = isListening
    ? isCapturing
      ? "Listening. Speak now."
      : "Preparing your microphone."
    : status === "processing"
      ? "Converting speech to text."
      : status === "completed"
        ? "Speech added successfully."
        : "";

  if (!isSupported) return null;

  const transition = { duration: reduce ? 0 : 0.22, ease: EASE_OUT_EXPO };

  const panel = (key: string, children: ReactNode) => (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );

  return (
    <div className={cn("mt-5", className)}>
      {/* ──────── OR ──────── */}
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait" initial={false}>
          {status === "listening"
            ? panel(
                "listening",
                <div className={cn(panelBase, "border-accent/40 bg-accent-subtle/60")}>
                  {/* Glowing, pulsing microphone. */}
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                    {reduce ? null : (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-accent"
                        animate={{ scale: [1, 1.75], opacity: [0.4, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                    <span className="asc-gradient-accent asc-shadow-accent relative flex h-10 w-10 items-center justify-center rounded-full text-white">
                      <Mic className="h-4.5 w-4.5" strokeWidth={1.8} />
                    </span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <motion.span
                        aria-hidden
                        className="h-2 w-2 rounded-full bg-danger"
                        animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {isCapturing ? "Listening…" : "Preparing microphone…"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted text-pretty">{listeningHint}</p>
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-3">
                    <SpeechWaveform />
                    <span
                      aria-hidden
                      className="asc-tabular text-sm font-medium text-foreground-soft"
                    >
                      {formatElapsed(elapsedSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={stop}
                      aria-label={`Stop listening. Recording time ${formatElapsed(elapsedSeconds)}.`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                      Stop
                    </button>
                  </div>
                </div>,
              )
            : null}

          {status === "processing"
            ? panel(
                "processing",
                <div className={cn(panelBase, "border-border bg-surface-muted/50")}>
                  <motion.span
                    aria-hidden
                    className="asc-gradient-subtle flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent-text"
                    animate={reduce ? undefined : { scale: [1, 0.86, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                  </motion.span>
                  <p className="text-sm font-medium text-foreground">Converting speech…</p>
                </div>,
              )
            : null}

          {status === "completed"
            ? panel(
                "completed",
                <div className={cn(panelBase, "border-success/35 bg-success-subtle")}>
                  <motion.span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-success"
                    initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
                  >
                    <CheckCircle2 className="h-5.5 w-5.5" strokeWidth={1.9} />
                  </motion.span>
                  <p className="text-sm font-medium text-foreground">
                    Speech added successfully
                  </p>
                  <button
                    type="button"
                    onClick={start}
                    className="ml-auto text-sm font-medium text-accent-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Speak again
                  </button>
                </div>,
              )
            : null}

          {status === "error"
            ? panel(
                "error",
                <div
                  role="alert"
                  className={cn(panelBase, "border-danger/35 bg-danger-subtle")}
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-danger" strokeWidth={1.9} />
                  <p className="min-w-0 flex-1 text-sm text-foreground text-pretty">
                    {errorMessage}
                  </p>
                  <div className="ml-auto flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={start}
                      className="text-sm font-medium text-accent-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={dismissError}
                      className="text-sm font-medium text-muted underline-offset-4 hover:text-foreground-soft hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>,
              )
            : null}

          {status === "idle"
            ? panel(
                "idle",
                <button
                  type="button"
                  onClick={start}
                  aria-label={`${idleLabel} using your microphone`}
                  className={cn(
                    "group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5",
                    "text-sm font-medium text-foreground shadow-xs",
                    "transition-[border-color,background-color,color,box-shadow] duration-200",
                    "hover:border-accent/45 hover:bg-accent-subtle/45 hover:text-accent-text hover:shadow-sm",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  )}
                >
                  <span className="asc-gradient-subtle flex h-8 w-8 items-center justify-center rounded-full text-accent-text transition-transform duration-200 group-hover:scale-105">
                    <Mic className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  {idleLabel}
                </button>,
              )
            : null}
        </AnimatePresence>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
