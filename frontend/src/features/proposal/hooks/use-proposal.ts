import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { proposalService } from "@/services/proposal.service";

export const PROPOSAL_QUERY_KEY = "proposal";

/** `data === null` means no proposal generated yet (a 404 treated as a valid empty state). */
export function useProposal(consultationId: string | null) {
  return useQuery({
    queryKey: [PROPOSAL_QUERY_KEY, consultationId],
    queryFn: async () => {
      try {
        return await proposalService.get(consultationId as string);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(consultationId),
    staleTime: 15_000,
  });
}
