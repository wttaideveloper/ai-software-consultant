import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PROPOSAL_QUERY_KEY } from "@/features/proposal/hooks/use-proposal";
import { proposalService } from "@/services/proposal.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useGenerateProposal(consultationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => proposalService.generate(consultationId),
    onSuccess: (proposal) => {
      queryClient.setQueryData([PROPOSAL_QUERY_KEY, consultationId], proposal);
      toast.success(proposal.version > 1 ? "Proposal regenerated." : "Proposal generated.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't generate the proposal."));
    },
  });
}
