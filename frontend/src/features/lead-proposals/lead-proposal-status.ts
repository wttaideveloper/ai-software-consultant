import type { LeadProposalStatus } from "@/types";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

/**
 * Single source of truth for how each proposal status is presented — the same
 * pattern CLIENT_LEAD_STATUS_META follows for lead statuses.
 *
 * Mirrors the six members of the `lead_proposal_status` pgEnum.
 */
export const LEAD_PROPOSAL_STATUS_META: Record<
  LeadProposalStatus,
  { label: string; variant: BadgeVariant; description: string }
> = {
  DRAFT: {
    label: "Draft",
    variant: "default",
    description: "Still being written. Only drafts can be deleted.",
  },
  READY: {
    label: "Ready",
    variant: "info",
    description: "Finished internally, not yet sent to the client.",
  },
  SENT: {
    label: "Sent",
    variant: "accent",
    description: "Shared with the client and awaiting their response.",
  },
  ACCEPTED: {
    label: "Accepted",
    variant: "success",
    description: "The client accepted this version.",
  },
  REJECTED: {
    label: "Rejected",
    variant: "danger",
    description: "The client declined this version.",
  },
  ARCHIVED: {
    label: "Archived",
    variant: "warning",
    description: "Superseded and filed away. Restore it to a draft to reuse it.",
  },
};

/**
 * Mirrors ALLOWED_TRANSITIONS in lead-proposal.service.ts.
 *
 * The server is the authority — this copy exists only so the UI can offer the
 * moves that will actually succeed instead of surfacing a 400 after the click.
 * If the two ever disagree, the server wins and the request simply fails.
 */
export const LEAD_PROPOSAL_TRANSITIONS: Record<
  LeadProposalStatus,
  LeadProposalStatus[]
> = {
  DRAFT: ["READY", "ARCHIVED"],
  READY: ["DRAFT", "SENT", "ARCHIVED"],
  SENT: ["ACCEPTED", "REJECTED", "ARCHIVED"],
  ACCEPTED: ["ARCHIVED"],
  REJECTED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

/** Verb shown on the button that performs a transition. */
export const LEAD_PROPOSAL_TRANSITION_LABEL: Record<LeadProposalStatus, string> = {
  DRAFT: "Reopen as draft",
  READY: "Mark ready",
  SENT: "Mark sent",
  ACCEPTED: "Mark accepted",
  REJECTED: "Mark rejected",
  ARCHIVED: "Archive",
};
