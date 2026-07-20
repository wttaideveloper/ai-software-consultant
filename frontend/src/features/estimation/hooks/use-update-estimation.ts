import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ESTIMATION_QUERY_KEY } from "@/features/estimation/hooks/use-estimation";
import { estimationService } from "@/services/estimation.service";
import type { Estimation, UpdateEstimationPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

export function useUpdateEstimation(consultationId: string) {
  const queryClient = useQueryClient();
  const queryKey = [ESTIMATION_QUERY_KEY, consultationId];

  return useMutation({
    mutationFn: (payload: UpdateEstimationPayload) =>
      estimationService.update(consultationId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Estimation | null>(queryKey);

      if (previous) {
        queryClient.setQueryData<Estimation>(queryKey, {
          ...previous,
          ...payload,
          generatedBy: "USER",
          version: previous.version + 1,
        });
      }

      return { previous };
    },

    onSuccess: (estimation) => {
      queryClient.setQueryData(queryKey, estimation);
      toast.success("Estimation saved.");
    },

    onError: (error, _payload, context) => {
      if (context && context.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getApiErrorMessage(error, "Couldn't save changes."));
    },
  });
}
