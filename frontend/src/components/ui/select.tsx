import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <label className="flex w-full flex-col gap-1.5" htmlFor={selectId}>
        {label ? (
          <span className="text-sm font-medium text-foreground-soft">{label}</span>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 w-full appearance-none rounded-[10px] border border-border bg-surface px-3 text-sm text-foreground",
            "transition-colors",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            error && "border-danger focus:border-danger focus:ring-danger/20",
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
        {error ? <span className="text-xs text-danger">{error}</span> : null}
      </label>
    );
  },
);

Select.displayName = "Select";
