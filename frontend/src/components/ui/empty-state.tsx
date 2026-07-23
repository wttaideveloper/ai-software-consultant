import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO, fadeIn } from "@/utils/motion";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong",
        "bg-surface px-6 py-16 text-center",
        className,
      )}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.35, ease: EASE_OUT_EXPO }}
        className="relative mb-5"
      >
        {/* Soft halo behind the glyph gives the state a focal point without
            adding another bordered box. */}
        <div
          aria-hidden
          className="asc-gradient-subtle absolute inset-0 -z-10 scale-150 rounded-full opacity-70 blur-xl"
        />
        <div className="asc-gradient-subtle flex h-14 w-14 items-center justify-center rounded-2xl text-accent-text shadow-sm">
          <Icon className="h-6 w-6" strokeWidth={1.6} />
        </div>
      </motion.div>

      <h3 className="text-lg font-semibold tracking-tight text-foreground text-balance">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted text-pretty">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}
