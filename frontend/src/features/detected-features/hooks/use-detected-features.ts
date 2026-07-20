import { useQuery } from "@tanstack/react-query";
import { featureDetectionService } from "@/services/feature-detection.service";

export const DETECTED_FEATURES_QUERY_KEY = "detected-features";

export function useDetectedFeatures(consultationId: string | null) {
  return useQuery({
    queryKey: [DETECTED_FEATURES_QUERY_KEY, consultationId],
    queryFn: () => featureDetectionService.list(consultationId as string),
    enabled: Boolean(consultationId),
    staleTime: 15_000,
  });
}
