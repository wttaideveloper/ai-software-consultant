import { forwardRef, type InputHTMLAttributes } from "react";
import { FieldShell } from "@/components/ui/field";
import {
  fieldControlBase,
  fieldControlError,
} from "@/components/ui/field-styles";
import { cn } from "@/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <FieldShell id={inputId} label={label} hint={hint} error={error}>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldControlBase,
            "h-10 px-3.5",
            error && fieldControlError,
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

Input.displayName = "Input";
