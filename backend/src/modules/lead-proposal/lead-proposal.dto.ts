import type { LeadProposalContent } from "../../db/schema/lead-proposals.js";
import type { LeadProposalStatus } from "./lead-proposal.repository.js";

export type PaginationMetaDto = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Row shape for the version list and the proposal library.
 *
 * Excludes `proposalJson` — neither list renders the body, and a library page of
 * 100 proposals would otherwise ship a large amount of JSON the client discards.
 * The detail endpoint returns it.
 */
export type LeadProposalListItemDto = {
  id: string;
  leadId: string;
  versionNumber: number;
  title: string;
  status: LeadProposalStatus;
  notes: string | null;
  pdfPath: string | null;
  docxPath: string | null;
  /** Client context, joined — the library shows who each proposal is for. */
  leadName: string;
  leadCompany: string | null;
  /** Null when the author's user record has been deleted. */
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Full version for the Proposal Editor. */
export type LeadProposalDetailDto = LeadProposalListItemDto & {
  content: LeadProposalContent;
};

/**
 * Roll-up shared by the Lead Details tiles, the editor's history panel and the
 * library's per-client view. Each field is "the newest version that is X", so
 * they can legitimately point at the same version (a lead whose V7 draft is also
 * its latest) or at nothing (a lead with no draft open).
 */
export type LeadProposalSummaryDto = {
  total: number;
  /** Highest version number, whatever its status. */
  latest: LeadProposalListItemDto | null;
  /** Newest DRAFT — what an admin is currently working on. */
  workingDraft: LeadProposalListItemDto | null;
  /** Newest version the client has seen (sent, accepted or rejected). */
  clientVersion: LeadProposalListItemDto | null;
  latestSent: LeadProposalListItemDto | null;
  latestAccepted: LeadProposalListItemDto | null;
};

/** One library row when the library is grouped by client. */
export type LeadProposalLeadRollupDto = {
  leadId: string;
  leadName: string;
  leadCompany: string | null;
  summary: LeadProposalSummaryDto;
};

export type PaginatedLeadProposalRollupsDto = {
  items: LeadProposalLeadRollupDto[];
  meta: PaginationMetaDto;
};

/**
 * What openForEditing() returns.
 *
 * `created` tells the UI whether it is looking at the version it asked for or a
 * fresh draft forked from it — that single flag is what drives the "V6 is
 * locked, a new draft V7 has been created" toast, so the UI never has to
 * re-derive the rule the server just applied.
 */
export type LeadProposalEditSessionDto = {
  proposal: LeadProposalDetailDto;
  created: boolean;
  source: {
    id: string;
    versionNumber: number;
    status: LeadProposalStatus;
  } | null;
};

/**
 * Versions of one lead. Deliberately not paginated, unlike every list endpoint
 * in this codebase: the set is small and bounded by how many versions a human
 * authors, and the workspace shows all of them at once.
 */
export type LeadProposalVersionsDto = {
  items: LeadProposalListItemDto[];
  summary: LeadProposalSummaryDto;
};

export type PaginatedLeadProposalsDto = {
  items: LeadProposalListItemDto[];
  meta: PaginationMetaDto;
};
