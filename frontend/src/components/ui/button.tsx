import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline"
  | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
} & Omit<HTMLMotionProps<"button">, "children" | "disabled" | "type">;

const variants: Record<ButtonVariant, string> = {
  primary:
    "asc-gradient-accent text-white shadow-sm hover:shadow-md hover:asc-shadow-accent active:shadow-sm",
  secondary:
    "border border-border bg-surface text-foreground shadow-xs hover:border-border-strong hover:bg-surface-muted hover:shadow-sm",
  ghost:
    "bg-transparent text-foreground-soft hover:bg-surface-muted hover:text-foreground",
  danger:
    "bg-danger text-white shadow-sm hover:brightness-110 hover:shadow-md active:brightness-95",
  outline:
    "border border-border-strong bg-transparent text-foreground hover:border-accent/50 hover:bg-accent-subtle hover:text-accent-text",
  subtle:
    "asc-gradient-subtle text-accent-text hover:bg-accent-subtle-hover",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-9.5 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-sm rounded-xl gap-2",
  icon: "h-9.5 w-9.5 rounded-lg justify-center",
  "icon-sm": "h-8 w-8 rounded-lg justify-center",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  isLoading,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isInert = disabled || isLoading;

  return (
    <motion.button
      type={type}
      // Lift only — scaling a gradient fill resamples the text and reads soft.
      whileHover={isInert ? undefined : { y: -1 }}
      whileTap={isInert ? undefined : { y: 0, scale: 0.985 }}
      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
      className={cn(
        "relative inline-flex items-center justify-center font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color,box-shadow,filter] duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-55 disabled:shadow-none",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={isInert}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {/* Children stay mounted while loading so the button keeps its width
          and the row below it doesn't reflow mid-submit. */}
      <span
        className={cn(
          "inline-flex items-center gap-[inherit] transition-opacity duration-150",
          isLoading && "opacity-0",
        )}
      >
        {children}
      </span>
      {isLoading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        </span>
      ) : null}
    </motion.button>
  );
}
