import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/utils/motion";

type QuestionProgressProps = {
  /** 1-based position of the question being answered. */
  current: number;
  /** Total questions this consultation will ask — from the chosen length, never a literal. */
  total: number;
};

/**
 * "AI Question X of N" + a proportional fill bar, shown only while the AI discovery
 * interview is running. Scoped to that one step on purpose: the later steps (Summary,
 * Features, Estimate, Mockups, Proposal) are single screens with nothing to count
 * through, and the wizard's own WizardProgress already covers step-level position.
 *
 * Both counts are passed in rather than read from the store here, so the component
 * stays presentational and the "which question are we on" rule lives in one place
 * (the step) alongside the interview state it is derived from.
 */
export function QuestionProgress({ current, total }: QuestionProgressProps) {
  // Clamped rather than trusted: a model that talks past its budget must degrade to
  // a full bar, never a >100% one or a NaN width.
  const safeTotal = Math.max(Math.round(total), 1);
  const safeCurrent = Math.min(Math.max(Math.round(current), 1), safeTotal);
  const percent = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        AI Question {safeCurrent} of {safeTotal}
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeCurrent}
        aria-valuetext={`AI question ${safeCurrent} of ${safeTotal}, ${percent}% complete`}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <motion.div
          className="asc-gradient-accent h-full rounded-full"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        />
      </div>

      <p className="mt-2 text-xs text-muted">{percent}% Complete</p>
    </div>
  );
}
