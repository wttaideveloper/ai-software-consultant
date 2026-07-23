import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id ?? props.name;

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "group inline-flex cursor-pointer items-center gap-2.5 select-none",
          props.disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="relative inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              "peer h-4.5 w-4.5 appearance-none rounded-sm border border-border-strong bg-surface",
              "shadow-xs transition-[background-color,border-color,box-shadow] duration-150",
              "group-hover:border-accent/60",
              "checked:border-accent checked:bg-accent checked:shadow-none",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              "disabled:cursor-not-allowed",
              className,
            )}
            {...props}
          />
          <Check
            className={cn(
              "pointer-events-none absolute h-3 w-3 text-white",
              "scale-75 opacity-0 transition-[opacity,transform] duration-150",
              "peer-checked:scale-100 peer-checked:opacity-100",
            )}
            strokeWidth={3.5}
          />
        </span>
        {label ? (
          <span className="text-sm leading-snug text-foreground-soft">{label}</span>
        ) : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
