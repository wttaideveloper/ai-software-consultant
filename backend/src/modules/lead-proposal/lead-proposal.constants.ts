import type { LeadProposalStatus } from "./lead-proposal.repository.js";

/**
 * The only editable status. Every other status is immutable: its body is the
 * record of what existed at that point, and editing it would rewrite history.
 * Enforced in the service, not just the UI.
 */
export const EDITABLE_STATUS = "DRAFT" as const;

/** Statuses that mean "the client has seen this version". */
export const CLIENT_FACING_STATUSES: LeadProposalStatus[] = [
  "SENT",
  "ACCEPTED",
  "REJECTED",
];

/**
 * Why a version came into existence. Recorded on every create so the history is
 * self-explaining ("V7 exists because V6 was regenerated") rather than a list of
 * numbers, and so a future activity feed or version-compare view has the
 * provenance it needs without new columns.
 */
export const VERSION_REASONS = {
  /** Explicit "Create New Version" from a lead's requirement snapshot. */
  MANUAL: "MANUAL",
  /** Explicit "Duplicate" of an existing version. */
  DUPLICATED: "DUPLICATED",
  /** Rule 2 — an admin opened a READY proposal to edit it. */
  EDIT_READY: "EDIT_READY",
  /** Rule 3 — an admin opened a SENT/ACCEPTED/REJECTED/ARCHIVED proposal to edit it. */
  EDIT_LOCKED: "EDIT_LOCKED",
  /** "Regenerate" — never overwrites, always forks. */
  REGENERATED: "REGENERATED",
  /** One-time upgrade of a pre-`lead_proposals` browser draft. */
  IMPORTED: "IMPORTED",
} as const;

export type VersionReason = (typeof VERSION_REASONS)[keyof typeof VERSION_REASONS];

/** Human phrasing, used in audit rows and surfaced in the UI. */
export const VERSION_REASON_LABEL: Record<VersionReason, string> = {
  MANUAL: "Created from the client request",
  DUPLICATED: "Duplicated from an earlier version",
  EDIT_READY: "Edited a ready proposal",
  EDIT_LOCKED: "Edited a locked proposal",
  REGENERATED: "Regenerated from the client request",
  IMPORTED: "Imported from a locally saved draft",
};

/**
 * Written to the existing `audit_logs` table — no new table.
 *
 * `audit_logs` has been in the schema since the foundation migration with no
 * writers; a version fork is exactly the entity/action/before/after shape it was
 * built for, and using it means any future activity feed reads one place rather
 * than a proposal-specific log nobody else knows about.
 */
export const LEAD_PROPOSAL_AUDIT = {
  ENTITY_TYPE: "lead_proposal",
  ACTION_VERSION_CREATED: "LEAD_PROPOSAL_VERSION_CREATED",
} as const;
