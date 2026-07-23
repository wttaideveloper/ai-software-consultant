import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { leadProposalsService } from "@/services/lead-proposals.service";
import type { ListLeadProposalsParams } from "@/types";

export const LEAD_PROPOSALS_QUERY_KEY = "lead-proposals";

/** Every version of one lead, plus the total/latest/active roll-up. */
export function useLeadProposalVersions(leadId: string | undefined) {
  return useQuery({
    queryKey: [LEAD_PROPOSALS_QUERY_KEY, "versions", leadId],
    queryFn: () => leadProposalsService.listByLead(leadId!),
    enabled: Boolean(leadId),
    staleTime: 15_000,
  });
}

/** Proposal library — every version across every lead. */
export function useLeadProposalLibrary(
  params: ListLeadProposalsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [LEAD_PROPOSALS_QUERY_KEY, "library", params],
    queryFn: () => leadProposalsService.list(params),
    enabled,
    staleTime: 15_000,
    // Keeps the previous page rendered while the next one loads, so paging and
    // filtering don't flash the skeleton on every keystroke.
    placeholderData: keepPreviousData,
  });
}

/** Proposal library grouped by client: latest / working draft / client version. */
export function useLeadProposalClients(
  params: ListLeadProposalsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [LEAD_PROPOSALS_QUERY_KEY, "library-clients", params],
    queryFn: () => leadProposalsService.listByClient(params),
    enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

/** One version, with its body — what the editor loads. */
export function useLeadProposal(proposalId: string | undefined) {
  return useQuery({
    queryKey: [LEAD_PROPOSALS_QUERY_KEY, "detail", proposalId],
    queryFn: () => leadProposalsService.getById(proposalId!),
    enabled: Boolean(proposalId),
    staleTime: 15_000,
  });
}
