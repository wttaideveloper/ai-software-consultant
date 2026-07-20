import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PROPOSAL_QUERY_KEY } from "@/features/proposal/hooks/use-proposal";
import { proposalService } from "@/services/proposal.service";
import type { Proposal, UpdateProposalPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

export function useUpdateProposal(consultationId: string) {
  const queryClient = useQueryClient();
  const queryKey = [PROPOSAL_QUERY_KEY, consultationId];

  return useMutation({
    mutationFn: (payload: UpdateProposalPayload) =>
      proposalService.update(consultationId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Proposal | null>(queryKey);

      if (previous) {
        queryClient.setQueryData<Proposal>(queryKey, {
          ...previous,
          ...payload,
          generatedBy: "USER",
          version: previous.version + 1,
        });
      }

      return { previous };
    },

    onSuccess: (proposal) => {
      queryClient.setQueryData(queryKey, proposal);
      toast.success("Proposal saved.");
    },

    onError: (error, _payload, context) => {
      if (context && context.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getApiErrorMessage(error, "Couldn't save changes."));
    },
  });
}
