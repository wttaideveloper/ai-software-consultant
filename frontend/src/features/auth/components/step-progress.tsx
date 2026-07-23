import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

type StepProgressProps = {
  steps: readonly string[];
  currentStep: number;
};

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isComplete || isActive
                    ? "border-transparent bg-accent text-white"
                    : "border-border bg-surface text-muted",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium whitespace-nowrap sm:block",
                  isActive ? "text-foreground" : "text-muted",
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div className="mx-2 mb-5 h-px flex-1 bg-border">
                <motion.div
                  className="h-px bg-accent"
                  initial={false}
                  animate={{ width: isComplete ? "100%" : "0%" }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
