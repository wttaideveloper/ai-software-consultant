import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";
type BadgeSize = "sm" | "md";

const variants: Record<BadgeVariant, string> = {
  default: "border-border bg-surface-muted text-foreground-soft",
  accent: "border-accent/20 bg-accent-subtle text-accent-text",
  success: "border-success/20 bg-success-subtle text-success",
  warning: "border-warning/20 bg-warning-subtle text-warning",
  danger: "border-danger/20 bg-danger-subtle text-danger",
  info: "border-info/20 bg-info-subtle text-info",
  outline: "border-border-strong bg-transparent text-foreground-soft",
};

const sizes: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-xs",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Leading status dot — reads faster than colour alone in dense tables. */
  dot?: boolean;
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children}
    </span>
  );
}
