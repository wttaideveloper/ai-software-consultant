import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  clientEstimateService,
  type GenerateClientEstimateResponse,
} from "@/services/client-estimate.service";
import {
  useClientConsultationStore,
  type ClientFeature,
  type ClientFeatureBreakdownItem,
} from "@/store/client-consultation.store";
import { getApiErrorMessage } from "@/utils/api-error";

/** Matches each current feature to a breakdown entry by name — the AI often keys its breakdown by feature name when given distinct ones, but this is never assumed, only used when it actually matches. Unmatched features simply show no hours rather than a guessed value. */
function buildFeatureBreakdown(
  features: ClientFeature[],
  breakdown: GenerateClientEstimateResponse["breakdown"],
  previousIncluded: Map<string, boolean>,
): ClientFeatureBreakdownItem[] {
  return features.map((feature) => {
    const match = breakdown.find((item) => item.category.toLowerCase() === feature.name.toLowerCase());

    return {
      featureId: feature.id,
      name: feature.name,
      category: feature.category,
      complexity: feature.complexity,
      hours: match?.hours ?? null,
      included: previousIncluded.get(feature.id) ?? true,
    };
  });
}

export function useGenerateClientEstimate() {
  const features = useClientConsultationStore((state) => state.features);
  const featureBreakdown = useClientConsultationStore((state) => state.featureBreakdown);
  const applyEstimateResult = useClientConsultationStore((state) => state.applyEstimateResult);

  return useMutation({
    mutationFn: clientEstimateService.generate,
    onSuccess: (data) => {
      const previousIncluded = new Map(featureBreakdown.map((item) => [item.featureId, item.included]));

      applyEstimateResult({
        estimate: {
          estimatedHours: data.estimatedHours,
          estimatedWeeks: data.estimatedWeeks,
          teamSize: data.teamSize,
          complexity: data.complexity,
          confidence: data.confidence,
          assumptions: data.assumptions,
          risks: data.risks,
          breakdown: data.breakdown,
        },
        featureBreakdown: buildFeatureBreakdown(features, data.breakdown, previousIncluded),
        techStack: data.techStack,
        pricing: data.pricing,
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't generate the estimate. Please try again."));
    },
  });
}
