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
 * Roll-up shown above the version list. `active` is the version currently
 * representing the live offer (accepted > sent > ready, newest wins ties), or
 * null when every version is still a draft.
 */
export type LeadProposalSummary = {
  total: number;
  latest: LeadProposal | null;
  active: LeadProposal | null;
};

export type LeadProposalVersions = {
  items: LeadProposal[];
  summary: LeadProposalSummary;
};

/** Send `content` to create from a prefill, or `sourceProposalId` to duplicate. */
export type CreateLeadProposalPayload = {
  title?: string;
  content?: LeadProposalContent;
  sourceProposalId?: string;
  notes?: string;
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
};
