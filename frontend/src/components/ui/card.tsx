import { motion } from "framer-motion";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

type CardProps = {
  children: ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
};

export function Card({
  className,
  children,
  hover = true,
  onClick,
}: CardProps) {
  const isInteractive = Boolean(onClick);

  // A clickable div is invisible to keyboards and screen readers, so an
  // onClick card opts into button semantics and Enter/Space activation.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-sm",
        "transition-[box-shadow,border-color,background-color] duration-200",
        hover && "hover:border-border-strong hover:shadow-lg",
        isInteractive &&
          "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("mb-3 flex items-start justify-between gap-3", className)}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h3
      className={cn(
        "text-base font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("mt-1 text-sm leading-relaxed text-muted", className)}>
      {children}
    </p>
  );
}
