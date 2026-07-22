import { motion } from "framer-motion";

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
export function WizardProgress({ currentIndex, totalSteps, label }: WizardProgressProps) {
  const percent = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted">
          Step {currentIndex + 1} of {totalSteps}
        </span>
        <span className="font-medium text-foreground-soft">{label}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <motion.div
          className="asc-gradient-accent h-full rounded-full"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
