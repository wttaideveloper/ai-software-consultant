import type { ClientLeadFeature, Proposal } from "@/types";

/**
 * Working draft of a proposal for a Client Lead.
 *
 * ─── Why this is not the existing `Proposal` type ───────────────────────────
 * `project_proposals` requires four NOT NULL foreign keys — organizationId,
 * consultationId (unique), requirementSummaryId and estimationId. A client lead
 * has none of them: its summary, features and estimate are jsonb snapshots on
 * `client_leads`, not rows in those tables. Persisting a lead proposal there
 * would mean fabricating a consultation, a requirement_summaries row and a
 * project_estimations row per lead, which would pollute the Consultations
 * module with phantom records. That is a schema problem, and the schema is
 * frozen for this sprint.
 *
 * So this draft deliberately REUSES the existing `Proposal` field vocabulary
 * via Pick<> rather than redeclaring it. Every field below that exists as a
 * column carries the exact same name and type as the column, so migrating this
 * draft into `project_proposals` later is a field-for-field copy — no mapping
 * layer, no renames.
 *
 * ─── Fields with no column yet ──────────────────────────────────────────────
 * `features`, `teamStructure`, `risks` and `termsAndConditions` are required by
 * the Proposal Editor spec but have no counterpart in `project_proposals`.
 * They are grouped separately below so it is obvious which fields a future
 * migration must add.
 */
export type LeadProposalDraft = Pick<
  Proposal,
  | "title"
  | "executiveSummary"
  | "scopeOfWork"
  | "deliverables"
  | "timeline"
  | "assumptions"
  | "pricingNotes"
  | "status"
> & {
  // ── No column in project_proposals yet ──
  /** Snapshot copied from the lead, editable independently of the lead itself. */
  features: ClientLeadFeature[];
  teamStructure: string;
  risks: string[];
  termsAndConditions: string;
};

/** A draft plus the bookkeeping the editor needs to show save state. */
export type StoredLeadProposal = {
  leadId: string;
  draft: LeadProposalDraft;
  /** ISO timestamp of the last local save; null until first saved. */
  savedAt: string | null;
};
