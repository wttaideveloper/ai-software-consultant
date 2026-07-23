import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { FieldShell } from "@/components/ui/field";
import {
  fieldControlBase,
  fieldControlError,
} from "@/components/ui/field-styles";
import { cn } from "@/utils/cn";

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
      // `div`, not `label`: the reveal toggle sits inside the field, and a
      // wrapping <label> would forward its clicks to the input instead.
      <FieldShell as="div" id={inputId} label={label} hint={hint} error={error}>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={error ? true : undefined}
            className={cn(
              fieldControlBase,
              "h-10 px-3.5 pr-11",
              error && fieldControlError,
              className,
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((value) => !value)}
            className={cn(
              "absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg",
              "text-muted transition-colors hover:text-foreground",
            )}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.85} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.85} />
            )}
          </button>
        </div>
      </FieldShell>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
