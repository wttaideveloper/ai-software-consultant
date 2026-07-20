import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { REQUIREMENT_SUMMARY_QUERY_KEY } from "@/features/requirement-summary/hooks/use-requirement-summary";
import { requirementSummaryService } from "@/services/requirement-summary.service";
import type { RequirementSummary, UpdateRequirementSummaryPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

export function useUpdateRequirementSummary(consultationId: string) {
  const queryClient = useQueryClient();
  const queryKey = [REQUIREMENT_SUMMARY_QUERY_KEY, consultationId];

  return useMutation({
    mutationFn: (payload: UpdateRequirementSummaryPayload) =>
      requirementSummaryService.update(consultationId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RequirementSummary | null>(queryKey);

      if (previous) {
        queryClient.setQueryData<RequirementSummary>(queryKey, {
          ...previous,
          summary: payload.summaryMarkdown ?? previous.summary,
          structuredSummary: payload.structuredSummary ?? previous.structuredSummary,
          status: payload.status ?? previous.status,
          generatedBy: "USER",
          version: previous.version + 1,
        });
      }

      return { previous };
    },

    onSuccess: (summary) => {
      queryClient.setQueryData(queryKey, summary);
      toast.success("Requirement summary saved.");
    },

    onError: (error, _payload, context) => {
      if (context && context.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getApiErrorMessage(error, "Couldn't save changes."));
    },
  });
}
