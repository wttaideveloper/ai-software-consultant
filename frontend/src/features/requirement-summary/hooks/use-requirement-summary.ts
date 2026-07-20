import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { requirementSummaryService } from "@/services/requirement-summary.service";

export const REQUIREMENT_SUMMARY_QUERY_KEY = "requirement-summary";

/**
 * `data === null` means "no summary generated yet" (a 404 from the backend,
 * treated as a valid empty state, not a query error). Any other failure
 * (network, 500, 403) surfaces normally via isError.
 */
export function useRequirementSummary(consultationId: string | null) {
  return useQuery({
    queryKey: [REQUIREMENT_SUMMARY_QUERY_KEY, consultationId],
    queryFn: async () => {
      try {
        return await requirementSummaryService.get(consultationId as string);
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
