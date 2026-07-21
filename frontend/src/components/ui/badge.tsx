import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger";

const variants: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-foreground-soft border-border",
  accent: "asc-gradient-subtle text-accent border-transparent",
  success:
    "border-transparent bg-gradient-to-br from-success-subtle to-[#cfefdd] text-success dark:to-[#123322]",
  warning:
    "border-transparent bg-gradient-to-br from-warning-subtle to-[#fce7c3] text-warning dark:to-[#3d2b0e]",
  danger:
    "border-transparent bg-gradient-to-br from-danger-subtle to-[#fbd5d5] text-danger dark:to-[#3d1414]",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
