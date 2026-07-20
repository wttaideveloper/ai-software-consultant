import { motion } from "framer-motion";
import { ConsultationProgress } from "@/features/consultations/components/consultation-progress";
import { ConsultationStatusBadge } from "@/features/consultations/components/consultation-status-badge";
import type { Consultation } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";
import { staggerItem } from "@/utils/motion";

type ConsultationListItemProps = {
  consultation: Consultation;
  isSelected: boolean;
  onSelect: () => void;
};

export function ConsultationListItem({
  consultation,
  isSelected,
  onSelect,
}: ConsultationListItemProps) {
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      onClick={onSelect}
      whileHover={{ x: isSelected ? 0 : 2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "w-full rounded-xl border px-3 py-3 text-left transition-colors",
        isSelected
          ? "asc-gradient-subtle border-accent/30"
          : "border-transparent hover:border-border hover:bg-surface-muted",
      )}
    >
      <p
        className={cn(
          "truncate text-sm font-medium",
          isSelected ? "text-accent" : "text-foreground",
        )}
      >
        {consultation.title}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <ConsultationStatusBadge status={consultation.status} />
        <span className="shrink-0 text-[11px] text-muted">
          {formatRelativeTime(consultation.updatedAt)}
        </span>
      </div>
      <ConsultationProgress status={consultation.status} className="mt-2" />
    </motion.button>
  );
}
