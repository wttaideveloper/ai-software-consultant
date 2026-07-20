import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DETECTED_FEATURES_QUERY_KEY } from "@/features/detected-features/hooks/use-detected-features";
import { featureDetectionService } from "@/services/feature-detection.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useDetectFeatures(consultationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => featureDetectionService.detect(consultationId),
    onSuccess: (result) => {
      queryClient.setQueryData([DETECTED_FEATURES_QUERY_KEY, consultationId], result);
      toast.success(`${result.total} feature${result.total === 1 ? "" : "s"} detected.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't detect features."));
    },
  });
}
