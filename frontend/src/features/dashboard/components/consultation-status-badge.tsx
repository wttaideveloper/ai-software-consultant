import { Badge } from "@/components/ui/badge";
import { CONSULTATION_STATUS_META } from "@/features/dashboard/consultation-status";
import type { ConsultationStatus } from "@/types";

type ConsultationStatusBadgeProps = {
  status: ConsultationStatus;
};

export function ConsultationStatusBadge({ status }: ConsultationStatusBadgeProps) {
  const meta = CONSULTATION_STATUS_META[status];
  return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>;
}
