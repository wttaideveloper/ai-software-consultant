import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DETECTED_FEATURES_QUERY_KEY } from "@/features/detected-features/hooks/use-detected-features";
import { featureDetectionService } from "@/services/feature-detection.service";
import type { DetectedFeaturesResponse } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

function removeFeature(data: DetectedFeaturesResponse, featureId: string): DetectedFeaturesResponse {
  const groups = data.groups
    .map((group) => ({
      ...group,
      features: group.features.filter((feature) => feature.id !== featureId),
    }))
    .filter((group) => group.features.length > 0);

  return { ...data, groups, total: Math.max(0, data.total - 1) };
}

export function useDeleteFeature(consultationId: string) {
  const queryClient = useQueryClient();
  const queryKey = [DETECTED_FEATURES_QUERY_KEY, consultationId];

  return useMutation({
    mutationFn: (featureId: string) => featureDetectionService.remove(featureId),

    onMutate: async (featureId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DetectedFeaturesResponse>(queryKey);

      if (previous) {
        queryClient.setQueryData<DetectedFeaturesResponse>(queryKey, removeFeature(previous, featureId));
      }

      return { previous };
    },

    onSuccess: () => {
      toast.success("Feature deleted.");
    },

    onError: (error, _featureId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getApiErrorMessage(error, "Couldn't delete the feature."));
    },
  });
}
