import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { distributeFeatureHours } from "@/client-portal/estimate/estimate-pricing";
import { clientEstimateService } from "@/services/client-estimate.service";
import {
  useClientConsultationStore,
  type ClientFeature,
  type ClientFeatureBreakdownItem,
} from "@/store/client-consultation.store";
import { getApiErrorMessage } from "@/utils/api-error";

/**
 * Gives every feature a share of the AI's total hours (split by complexity via
 * distributeFeatureHours), so toggling any row moves the total — and the live
 * Project Cost — sensibly. The AI returns one project total, not hours per
 * feature, so this split is the honest way to make the breakdown interactive
 * without a second AI call. `included` is carried over so a regenerate keeps the
 * client's earlier choices.
 */
function buildFeatureBreakdown(
  features: ClientFeature[],
  totalHours: number,
  previousIncluded: Map<string, boolean>,
): ClientFeatureBreakdownItem[] {
  const hoursByFeature = distributeFeatureHours(features, totalHours);

  return features.map((feature) => ({
    featureId: feature.id,
    name: feature.name,
    category: feature.category,
    complexity: feature.complexity,
    hours: hoursByFeature.get(feature.id) ?? 0,
    included: previousIncluded.get(feature.id) ?? true,
  }));
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
        featureBreakdown: buildFeatureBreakdown(features, data.estimatedHours, previousIncluded),
        techStack: data.techStack,
        pricing: data.pricing,
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't generate the estimate. Please try again."));
    },
  });
}
