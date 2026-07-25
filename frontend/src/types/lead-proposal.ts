import type { ClientLeadFeature } from "@/types/client-lead";

/**
 * Versioned proposals for a client lead (`lead_proposals`).
 *
 * The status union mirrors the `lead_proposal_status` pgEnum exactly. It is a
 * different axis from `ClientLeadStatus` — a lead's sales stage and a proposal's
 * lifecycle move independently and are never mixed.
 */
export const LEAD_PROPOSAL_STATUSES = [
  "DRAFT",
  "READY",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "ARCHIVED",
] as const;

export type LeadProposalStatus = (typeof LEAD_PROPOSAL_STATUSES)[number];

/**
 * The editable Project Estimate carried by a proposal version.
 *
 * Prefilled from the lead's frozen snapshot, then editable per version — so an
 * admin can adjust the figures for a specific proposal without touching the
 * client's original (immutable) lead estimate. Cost and timeline are stored as
 * range endpoints because that is exactly what the client is shown; `costMin`/
 * `costMax` are null when the lead had no pricing snapshot. Optional on the
 * content so versions created before this field simply fall back to the lead.
 */
export type ProposalProjectEstimate = {
  /** ISO currency code used to format the cost range (e.g. "INR"). */
  currency: string;
  costMin: number | null;
  costMax: number | null;
  timelineMinWeeks: number;
  timelineMaxWeeks: number;
  estimatedHours: number;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  teamSize: number;
  techStack: string[];
};

/**
 * The authored body of a version — everything the editor writes except the
 * title and status, which are columns because the library sorts and filters on
 * them. Mirrors the `proposal_json` jsonb type field for field.
 */
export type LeadProposalContent = {
  executiveSummary: string;
  scopeOfWork: string[];
  deliverables: string[];
  timeline: string;
  teamStructure: string;
  assumptions: string;
  risks: string[];
  pricingNotes: string;
  termsAndConditions: string;
  features: ClientLeadFeature[];
  /** Editable estimate; absent on versions created before it existed. */
  projectEstimate?: ProposalProjectEstimate;
};

/** Row shape returned by the version list and the proposal library. */
export type LeadProposal = {
  id: string;
  leadId: string;
  versionNumber: number;
  title: string;
  status: LeadProposalStatus;
  notes: string | null;
  /** Reserved for server-side export storage; null while export runs in-browser. */
  pdfPath: string | null;
  docxPath: string | null;
  leadName: string;
  leadCompany: string | null;
  /** Null when the author's user record has been deleted. */
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Full version returned by GET /api/lead-proposals/:id — what the editor loads. */
export type LeadProposalDetail = LeadProposal & {
  content: LeadProposalContent;
};

/**
 * Roll-up shared by the Lead Details tiles, the editor's history panel and the
 * library's per-client view. Each field is "the newest version that is X", so
 * they can point at the same version or at nothing.
 */
export type LeadProposalSummary = {
  total: number;
  /** Highest version number, whatever its status. */
  latest: LeadProposal | null;
  /** Newest DRAFT — the version currently being worked on. */
  workingDraft: LeadProposal | null;
  /** Newest version the client has seen (sent, accepted or rejected). */
  clientVersion: LeadProposal | null;
  latestSent: LeadProposal | null;
  latestAccepted: LeadProposal | null;
};

export type LeadProposalVersions = {
  items: LeadProposal[];
  summary: LeadProposalSummary;
};

/** One library row when the library is grouped by client. */
export type LeadProposalLeadRollup = {
  leadId: string;
  leadName: string;
  leadCompany: string | null;
  summary: LeadProposalSummary;
};

/**
 * Result of asking the server to open a version for editing.
 *
 * `created` is false when the version was already a draft (Rule 1) and true
 * when the server forked a new draft because the version was locked (Rules 2
 * and 3) — the UI reads this flag rather than re-deriving the rule.
 */
export type LeadProposalEditSession = {
  proposal: LeadProposalDetail;
  created: boolean;
  source: {
    id: string;
    versionNumber: number;
    status: LeadProposalStatus;
  } | null;
};

/** Only the reasons a client may originate; edit-forks are decided server-side. */
export type LeadProposalCreateReason = "MANUAL" | "DUPLICATED" | "IMPORTED";

/** Send `content` to create from a prefill, or `sourceProposalId` to duplicate. */
export type CreateLeadProposalPayload = {
  title?: string;
  content?: LeadProposalContent;
  sourceProposalId?: string;
  notes?: string;
  reason?: LeadProposalCreateReason;
};

/** Regenerate carries only the new body; the server owns version and status. */
export type RegenerateLeadProposalPayload = {
  title: string;
  content: LeadProposalContent;
};

export type UpdateLeadProposalPayload = {
  title?: string;
  content?: LeadProposalContent;
  notes?: string | null;
};

export type ListLeadProposalsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeadProposalStatus;
  leadId?: string;
  sortBy?: "updatedAt" | "createdAt" | "title";
  sortDir?: "asc" | "desc";
  /** "versions" (default) = one row per version; "clients" = one row per client. */
  groupBy?: "versions" | "clients";
};
