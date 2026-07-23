import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { FieldShell } from "@/components/ui/field";
import {
  fieldControlBase,
  fieldControlError,
} from "@/components/ui/field-styles";
import { cn } from "@/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <FieldShell id={selectId} label={label} hint={hint} error={error}>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            className={cn(
              fieldControlBase,
              // `appearance-none` strips the native arrow, so pr-10 reserves
              // room for the chevron drawn below it.
              "h-10 cursor-pointer appearance-none px-3.5 pr-10",
              error && fieldControlError,
              className,
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
          />
        </div>
      </FieldShell>
    );
  },
);

Select.displayName = "Select";
