import { forwardRef, type TextareaHTMLAttributes } from "react";
import { FieldShell } from "@/components/ui/field";
import {
  fieldControlBase,
  fieldControlError,
} from "@/components/ui/field-styles";
import { cn } from "@/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const textareaId = id ?? props.name;

    return (
      <FieldShell id={textareaId} label={label} hint={hint} error={error}>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldControlBase,
            "min-h-28 resize-y px-3.5 py-2.5 leading-relaxed",
            error && fieldControlError,
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

Textarea.displayName = "Textarea";
