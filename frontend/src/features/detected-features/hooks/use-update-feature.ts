import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DETECTED_FEATURES_QUERY_KEY } from "@/features/detected-features/hooks/use-detected-features";
import { featureDetectionService } from "@/services/feature-detection.service";
import type { DetectedFeature, DetectedFeaturesResponse, UpdateFeaturePayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

type UpdateVariables = {
  featureId: string;
  payload: UpdateFeaturePayload;
};

type MutationContext = {
  previous?: DetectedFeaturesResponse;
};

function mapFeature(
  data: DetectedFeaturesResponse,
  featureId: string,
  updater: (feature: DetectedFeature) => DetectedFeature,
): DetectedFeaturesResponse {
  return {
    ...data,
    groups: data.groups.map((group) => ({
      ...group,
      features: group.features.map((feature) =>
        feature.id === featureId ? updater(feature) : feature,
      ),
    })),
  };
}

export function useUpdateFeature(consultationId: string) {
  const queryClient = useQueryClient();
  const queryKey = [DETECTED_FEATURES_QUERY_KEY, consultationId];

  return useMutation<DetectedFeature, unknown, UpdateVariables, MutationContext>({
    mutationFn: ({ featureId, payload }) => featureDetectionService.update(featureId, payload),

    onMutate: async ({ featureId, payload }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DetectedFeaturesResponse>(queryKey);

      if (previous) {
        queryClient.setQueryData<DetectedFeaturesResponse>(
          queryKey,
          mapFeature(previous, featureId, (feature) => ({ ...feature, ...payload })),
        );
      }

      return { previous };
    },

    onSuccess: (updatedFeature, { featureId }, context) => {
      const originalFeature = context.previous?.groups
        .flatMap((group) => group.features)
        .find((feature) => feature.id === featureId);

      // Category changes move the feature between group cards — safer to
      // refetch than to hand-patch the grouping in place.
      if (originalFeature && originalFeature.featureCategory !== updatedFeature.featureCategory) {
        queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.setQueryData<DetectedFeaturesResponse>(queryKey, (current) =>
          current ? mapFeature(current, featureId, () => updatedFeature) : current,
        );
      }

      toast.success("Feature updated.");
    },

    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getApiErrorMessage(error, "Couldn't update the feature."));
    },
  });
}
