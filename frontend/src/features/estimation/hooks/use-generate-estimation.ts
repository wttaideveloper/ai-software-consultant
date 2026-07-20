import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ESTIMATION_QUERY_KEY } from "@/features/estimation/hooks/use-estimation";
import { estimationService } from "@/services/estimation.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useGenerateEstimation(consultationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => estimationService.generate(consultationId),
    onSuccess: (estimation) => {
      queryClient.setQueryData([ESTIMATION_QUERY_KEY, consultationId], estimation);
      toast.success(estimation.version > 1 ? "Estimation regenerated." : "Estimation generated.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't generate the estimation."));
    },
  });
}
