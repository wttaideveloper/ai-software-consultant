import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldError } from "@/utils/motion";

export type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? props.name;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground-soft">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "h-10 w-full rounded-[10px] border border-border bg-surface px-3 pr-10 text-sm text-foreground",
              "placeholder:text-muted transition-colors",
              "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted transition-colors hover:text-foreground-soft"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
