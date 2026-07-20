import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger";

const variants: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-foreground-soft border-border",
  accent: "asc-gradient-subtle text-accent border-transparent",
  success:
    "border-transparent bg-gradient-to-br from-success-subtle to-[#d4f0e6] text-success dark:to-[#1a4034]",
  warning:
    "border-transparent bg-gradient-to-br from-warning-subtle to-[#f7e4c4] text-warning dark:to-[#423318]",
  danger:
    "border-transparent bg-gradient-to-br from-danger-subtle to-[#f8d4d4] text-danger dark:to-[#4a2828]",
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
