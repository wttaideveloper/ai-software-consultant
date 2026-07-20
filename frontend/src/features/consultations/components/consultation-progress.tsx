import { motion } from "framer-motion";
import { CONSULTATION_STATUS_META } from "@/features/consultations/consultation-status";
import type { ConsultationStatus } from "@/types";
import { cn } from "@/utils/cn";

type ConsultationProgressProps = {
  status: ConsultationStatus;
  className?: string;
};

export function ConsultationProgress({ status, className }: ConsultationProgressProps) {
  const meta = CONSULTATION_STATUS_META[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-muted">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "cancelled" ? "bg-border-strong" : "asc-gradient-accent",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${meta.progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-xs text-muted tabular-nums">{meta.progress}%</span>
    </div>
  );
}
