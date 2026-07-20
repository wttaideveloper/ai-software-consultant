import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldError } from "@/utils/motion";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5" htmlFor={textareaId}>
        {label ? (
          <span className="text-sm font-medium text-foreground-soft">{label}</span>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "min-h-28 w-full rounded-[10px] border border-border bg-surface px-3 py-2.5 text-sm text-foreground",
            "placeholder:text-muted transition-colors resize-y",
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
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
