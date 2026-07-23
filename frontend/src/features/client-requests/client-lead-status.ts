import type { ClientLeadStatus } from "@/types";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

/**
 * Single source of truth for how each lead status is presented.
 *
 * Mirrors the four members of the `client_lead_status` pgEnum. PROPOSAL_SENT is
 * not represented because it does not exist in the database — see types/client-lead.ts.
 */
export const CLIENT_LEAD_STATUS_META: Record<
  ClientLeadStatus,
  { label: string; variant: BadgeVariant }
> = {
  NEW: { label: "New", variant: "info" },
  CONTACTED: { label: "Contacted", variant: "warning" },
  CONVERTED: { label: "Converted", variant: "success" },
  CLOSED: { label: "Closed", variant: "default" },
};
