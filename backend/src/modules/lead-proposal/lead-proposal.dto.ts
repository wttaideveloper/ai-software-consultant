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
 * Roll-up the Lead Details workspace shows above the version list.
 *
 * `active` is the version that currently represents the live offer to the
 * client: the highest-precedence status (accepted, then sent, then ready), with
 * the newest version winning ties. Drafts, rejections and archives are never
 * "active", so a lead whose only versions are drafts reports null rather than
 * implying something is with the client.
 */
export type LeadProposalSummaryDto = {
  total: number;
  latest: LeadProposalListItemDto | null;
  active: LeadProposalListItemDto | null;
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
