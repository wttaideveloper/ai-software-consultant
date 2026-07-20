import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldError } from "@/utils/motion";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5" htmlFor={inputId}>
        {label ? (
          <span className="text-sm font-medium text-foreground-soft">{label}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-sm text-foreground",
            "placeholder:text-muted transition-colors",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            error && "border-danger focus:border-danger focus:ring-danger/20",
            className,
          )}
          {...props}
        />
        <AnimatePresence initial={false}>
          {error ? (
            <motion.span
              key="error"
              variants={fieldError}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden text-xs text-danger"
            >
              {error}
            </motion.span>
          ) : null}
        </AnimatePresence>
        {!error && hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </label>
    );
  },
);

Input.displayName = "Input";
