import { api } from "@/services/api";
import type { ApiSuccessResponse, FeatureComplexity, FeaturePriority } from "@/types";

export type GenerateClientFeaturesPayload = {
  summary: string;
};

export type GeneratedClientFeature = {
  name: string;
  category: string;
  description: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
};

export type GenerateClientFeaturesResponse = {
  features: GeneratedClientFeature[];
};

/** Public, unauthenticated Client Portal endpoint — reuses the admin's FEATURE_DETECTION prompt server-side, not a duplicate feature-detection implementation. */
export const clientFeaturesService = {
  async generate(payload: GenerateClientFeaturesPayload): Promise<GenerateClientFeaturesResponse> {
    const response = await api.post<ApiSuccessResponse<GenerateClientFeaturesResponse>>(
      "/api/client/features",
      payload,
    );
    return response.data.data;
  },
};
