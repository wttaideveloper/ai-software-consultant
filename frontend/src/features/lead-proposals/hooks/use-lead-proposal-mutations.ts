import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LEAD_PROPOSALS_QUERY_KEY } from "@/features/lead-proposals/hooks/use-lead-proposals";
import { leadProposalsService } from "@/services/lead-proposals.service";
import type {
  CreateLeadProposalPayload,
  LeadProposalDetail,
  LeadProposalStatus,
  UpdateLeadProposalPayload,
} from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

/**
 * Every mutation invalidates the whole `lead-proposals` key rather than
 * surgically patching caches: a write can change the version list, the
 * total/latest/active roll-up and the library row all at once, and the lists are
 * small enough that a refetch is cheaper than keeping three caches consistent
 * by hand.
 */
function useInvalidateProposals() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [LEAD_PROPOSALS_QUERY_KEY] });
}

export function useCreateLeadProposal(leadId: string | undefined) {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: (payload: CreateLeadProposalPayload) =>
      leadProposalsService.create(leadId!, payload),
    onSuccess: (proposal: LeadProposalDetail) => {
      void invalidate();
      toast.success(`Proposal V${proposal.versionNumber} created.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't create the proposal version."));
    },
  });
}

export function useUpdateLeadProposal(proposalId: string | undefined) {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: (payload: UpdateLeadProposalPayload) =>
      leadProposalsService.update(proposalId!, payload),
    onSuccess: () => {
      void invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't save the proposal."));
    },
  });
}

export function useUpdateLeadProposalStatus() {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: ({
      proposalId,
      status,
    }: {
      proposalId: string;
      status: LeadProposalStatus;
    }) => leadProposalsService.updateStatus(proposalId, status),
    onSuccess: (proposal: LeadProposalDetail) => {
      void invalidate();
      toast.success(`Proposal V${proposal.versionNumber} marked ${proposal.status.toLowerCase()}.`);
    },
    onError: (error) => {
      // The server owns the transition rules; a rejected move arrives here with
      // its reason already written for a human.
      toast.error(getApiErrorMessage(error, "Couldn't update the proposal status."));
    },
  });
}

export function useDeleteLeadProposal() {
  const invalidate = useInvalidateProposals();

  return useMutation({
    mutationFn: (proposalId: string) => leadProposalsService.remove(proposalId),
    onSuccess: () => {
      void invalidate();
      toast.success("Draft proposal deleted.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't delete the proposal."));
    },
  });
}
