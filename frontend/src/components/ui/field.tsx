import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { fieldError } from "@/utils/motion";

/**
 * Shared chrome for every form control (Input, Textarea, Select, PasswordInput).
 * Centralising the label / error / hint markup keeps the `{ label, hint, error }`
 * contract identical across controls and gives react-hook-form's
 * `formState.errors` one predictable shape to map onto.
 *
 * Control styling lives in ./field-styles.
 */

type FieldShellProps = {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  /** `label` wraps the control (Input/Select); `div` is for controls that
      own an interactive child, where nesting would steal the click. */
  as?: "label" | "div";
  className?: string;
  children: ReactNode;
};

export function FieldShell({
  id,
  label,
  hint,
  error,
  as = "label",
  className,
  children,
}: FieldShellProps) {
  const Wrapper = as;

  const labelNode = label ? (
    as === "label" ? (
      <span className="text-sm font-medium text-foreground-soft">{label}</span>
    ) : (
      <label htmlFor={id} className="text-sm font-medium text-foreground-soft">
        {label}
      </label>
    )
  ) : null;

  return (
    <Wrapper
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...(as === "label" ? { htmlFor: id } : {})}
    >
      {labelNode}
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.span
            key="error"
            variants={fieldError}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="alert"
            className="overflow-hidden text-xs font-medium text-danger"
          >
            {error}
          </motion.span>
        ) : null}
      </AnimatePresence>
      {!error && hint ? (
        <span className="text-xs leading-relaxed text-muted">{hint}</span>
      ) : null}
    </Wrapper>
  );
}
