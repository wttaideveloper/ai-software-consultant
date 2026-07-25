import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

export type AiLoaderStep = { icon: LucideIcon; label: string };

type AiGenerationLoaderProps = {
  title: string;
  steps: AiLoaderStep[];
  caption?: string;
  /** How long each step stays "active" before advancing. */
  stepDurationMs?: number;
};

/**
 * A premium "AI is working" experience — a floating glyph with a soft glow, an
 * animated gradient progress bar, and a step checklist that advances and ticks off
 * as it goes. It shows *perceived* progress: the steps advance on a timer and hold
 * on the last one until the real result arrives and this unmounts — it never claims
 * "done" on its own.
 *
 * Fully reduced-motion aware: with reduced motion the glow, float and sequencing
 * stop, and it renders as a calm static checklist instead of a generic spinner.
 */
export function AiGenerationLoader({
  title,
  steps,
  caption = "This won't take long…",
  stepDurationMs = 1500,
}: AiGenerationLoaderProps) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      // Advance, then hold on the final step — real completion unmounts this.
      setActive((current) => (current < steps.length - 1 ? current + 1 : current));
    }, stepDurationMs);
    return () => window.clearInterval(id);
  }, [reduce, steps.length, stepDurationMs]);

  const progress = reduce ? 0.35 : (active + 1) / steps.length;
  const progressPercent = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center gap-7 rounded-2xl border border-border bg-surface-muted/40 px-6 py-14 text-center">
      {/* Floating glyph with a soft pulsing halo. */}
      <div className="relative">
        {reduce ? null : (
          <motion.div
            aria-hidden
            className="asc-gradient-subtle absolute inset-0 -z-10 rounded-full blur-xl"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <motion.div
          className="asc-gradient-accent asc-shadow-accent flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-7 w-7" strokeWidth={1.7} />
        </motion.div>
      </div>

      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted text-pretty">{caption}</p>
      </div>

      {/* Gradient progress bar. */}
      <div
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-sunken"
      >
        <motion.div
          className="asc-gradient-accent h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        />
      </div>

      {/* Step checklist. */}
      <ul className="flex w-full max-w-xs flex-col gap-3 text-left">
        {steps.map((step, index) => {
          const done = !reduce && index < active;
          const current = reduce ? index === 0 : index === active;
          const Icon = step.icon;

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center gap-3 text-sm transition-opacity duration-300",
                done || current ? "opacity-100" : "opacity-45",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
                  done
                    ? "bg-success-subtle text-success"
                    : current
                      ? "asc-gradient-subtle text-accent-text"
                      : "bg-surface-sunken text-muted",
                )}
              >
                {done ? (
                  <motion.span
                    initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </motion.span>
                ) : current && !reduce ? (
                  <motion.span
                    animate={{ scale: [1, 0.72, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </motion.span>
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              <span className={cn(current ? "font-medium text-foreground" : "text-foreground-soft")}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
