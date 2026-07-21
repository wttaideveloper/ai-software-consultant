import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

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
    "asc-gradient-accent asc-gradient-accent-interactive text-white shadow-md shadow-accent/25",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-surface-muted hover:border-border-strong",
  ghost:
    "bg-transparent text-foreground-soft hover:bg-surface-muted hover:text-foreground",
  danger:
    "bg-gradient-to-br from-danger to-[#b91c1c] text-white hover:opacity-95",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-surface-muted hover:border-border-strong",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-11 px-5 text-sm rounded-xl gap-2",
  icon: "h-10 w-10 rounded-xl justify-center",
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
  return (
    <motion.button
      type={type}
      whileHover={{ y: disabled || isLoading ? 0 : -1, scale: disabled || isLoading ? 1 : 1.015 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "inline-flex items-center font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        children
      )}
    </motion.button>
  );
}
