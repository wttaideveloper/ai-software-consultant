import type { ProposalStatus } from "@/types";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger";

export const PROPOSAL_STATUS_META: Record<ProposalStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "default" },
  REVIEWED: { label: "Reviewed", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
};

export const PROPOSAL_STATUS_OPTIONS: Array<{ label: string; value: ProposalStatus }> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Reviewed", value: "REVIEWED" },
  { label: "Approved", value: "APPROVED" },
];
