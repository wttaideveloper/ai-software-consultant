import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  CostPreview,
  FeatureComplexity,
  FeaturePriority,
} from "@/types";

export type EstimateFeatureInput = {
  name: string;
  category: string;
  description: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
};

export type GenerateClientEstimatePayload = {
  features: EstimateFeatureInput[];
  /** Wizard-selected platform labels — priced server-side by the Cost Engine. */
  platforms?: string[];
};

export type GenerateClientEstimateResponse = {
  estimatedHours: number;
  estimatedWeeks: number;
  teamSize: number;
  complexity: FeatureComplexity;
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: Array<{ category: string; hours: number }>;
  /** Recommended technology stack from the AI, or null when it returned none. */
  techStack: string[] | null;
  /** Final project cost from the Cost Engine (never the AI), or null on a pricing failure. */
  pricing: CostPreview | null;
};

/** Public, unauthenticated Client Portal endpoint — reuses the admin's ESTIMATION prompt server-side, not a duplicate estimation implementation. */
export const clientEstimateService = {
  async generate(
    payload: GenerateClientEstimatePayload,
  ): Promise<GenerateClientEstimateResponse> {
    const response = await api.post<ApiSuccessResponse<GenerateClientEstimateResponse>>(
      "/api/client/estimate",
      payload,
    );
    return response.data.data;
  },
};
