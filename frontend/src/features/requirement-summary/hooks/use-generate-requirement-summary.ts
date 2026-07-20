import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { REQUIREMENT_SUMMARY_QUERY_KEY } from "@/features/requirement-summary/hooks/use-requirement-summary";
import { requirementSummaryService } from "@/services/requirement-summary.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useGenerateRequirementSummary(consultationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requirementSummaryService.generate(consultationId),
    onSuccess: (summary) => {
      queryClient.setQueryData([REQUIREMENT_SUMMARY_QUERY_KEY, consultationId], summary);
      toast.success(
        summary.version > 1 ? "Requirement summary regenerated." : "Requirement summary generated.",
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't generate the requirement summary."));
    },
  });
}
