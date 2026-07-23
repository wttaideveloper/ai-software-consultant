import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/utils/motion";

type WizardProgressProps = {
  currentIndex: number;
  totalSteps: number;
  label: string;
};

/**
 * "Step X of N" + a proportional fill bar. Deliberately not a circle-per-step
 * indicator (see StepProgress) — this must stay legible if a step ever expands
 * into several (e.g. AI Questions becoming multiple pages), so it scales by
 * percentage rather than by rendering one element per step.
 */
export function WizardProgress({
  currentIndex,
  totalSteps,
  label,
}: WizardProgressProps) {
  const step = currentIndex + 1;
  const percent = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          Step {step} of {totalSteps}
        </span>
        <span className="truncate text-sm font-semibold text-foreground">
          {label}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={step}
        aria-valuetext={`Step ${step} of ${totalSteps}: ${label}`}
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <motion.div
          className="asc-gradient-accent h-full rounded-full"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        />
      </div>
    </div>
  );
}
