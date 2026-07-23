import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

type StepProgressProps = {
  steps: readonly string[];
  currentStep: number;
};

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <ol
      className="flex items-start"
      aria-label={`Step ${currentStep + 1} of ${steps.length}`}
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isActive = index === currentStep;

        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                  "transition-[background-color,border-color,color,box-shadow] duration-300",
                  isComplete && "border-transparent bg-accent text-white",
                  isActive &&
                    "asc-gradient-accent asc-shadow-accent border-transparent text-white",
                  !isComplete && !isActive && "border-border bg-surface text-muted",
                )}
              >
                {/* Soft halo marks the active step without changing its size,
                    so the row never shifts as you advance. */}
                {isActive ? (
                  <motion.span
                    aria-hidden
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -inset-1 -z-10 rounded-full bg-accent/20 blur-[3px]"
                  />
                ) : null}
                {isComplete ? (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                    className="flex"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </motion.span>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden max-w-24 text-center text-xs leading-tight font-medium transition-colors duration-300 sm:block",
                  isActive
                    ? "text-foreground"
                    : isComplete
                      ? "text-foreground-soft"
                      : "text-muted",
                )}
              >
                {step}
              </span>
            </div>

            {index < steps.length - 1 ? (
              <div className="mx-2 mt-4 h-0.5 flex-1 self-start overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={false}
                  animate={{ width: isComplete ? "100%" : "0%" }}
                  transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
