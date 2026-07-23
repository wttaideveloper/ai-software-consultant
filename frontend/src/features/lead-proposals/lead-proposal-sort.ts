import type { ListLeadProposalsParams } from "@/types";

/**
 * Library sort options.
 *
 * One control rather than a column plus a direction: "sortBy/sortDir" is an API
 * detail, and every combination worth offering is enumerable. Lives outside the
 * filters component so that file exports only components (Fast Refresh).
 */
export const PROPOSAL_SORT_OPTIONS: Array<{
  value: string;
  label: string;
  sortBy: NonNullable<ListLeadProposalsParams["sortBy"]>;
  sortDir: NonNullable<ListLeadProposalsParams["sortDir"]>;
}> = [
  { value: "updated-desc", label: "Last updated (newest)", sortBy: "updatedAt", sortDir: "desc" },
  { value: "updated-asc", label: "Last updated (oldest)", sortBy: "updatedAt", sortDir: "asc" },
  { value: "created-desc", label: "Created (newest)", sortBy: "createdAt", sortDir: "desc" },
  { value: "title-asc", label: "Proposal (A–Z)", sortBy: "title", sortDir: "asc" },
];

export type LeadProposalFilterValues = {
  search: string;
  status: string;
  leadId: string;
  /** One of PROPOSAL_SORT_OPTIONS[].value */
  sort: string;
};
