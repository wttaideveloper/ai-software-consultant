import type { ConsultationStatus } from "@/types";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger";

type StatusMeta = {
  label: string;
  badgeVariant: BadgeVariant;
  /** Coarse progress indicator derived from the real consultation status — not a fabricated metric. */
  progress: number;
};

export const CONSULTATION_STATUS_META: Record<ConsultationStatus, StatusMeta> = {
  draft: { label: "Draft", badgeVariant: "default", progress: 20 },
  in_progress: { label: "In Progress", badgeVariant: "accent", progress: 60 },
  completed: { label: "Completed", badgeVariant: "success", progress: 100 },
  cancelled: { label: "Cancelled", badgeVariant: "danger", progress: 0 },
};
