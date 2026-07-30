import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  ConsultationMode,
  CostPreview,
  FeatureComplexity,
  FeaturePriority,
  TechStackGroup,
} from "@/types";
import type {
  ClientEnhancementImpact,
  ClientMaintenancePlan,
  ClientMigrationPlan,
} from "@/store/client-consultation.store";

export type EstimateFeatureInput = {
  name: string;
  category: string;
  description: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
};

export type GenerateClientEstimatePayload = {
  /** Decides the estimate's shape — a support engagement returns no delivery weeks. */
  consultationMode: ConsultationMode;
  features: EstimateFeatureInput[];
  /**
   * Wizard-selected platform labels. Priced server-side by the Cost Engine, and —
   * since the technology engine was wired in — the signal that guarantees a
   * selected platform contributes technologies to the recommended stack.
   */
  platforms?: string[];
  /**
   * Project context for the technology engine only; neither field touches the
   * effort estimate. They let the engine infer the industry and the capabilities
   * a stack has to cover, which the feature list alone does not always reveal.
   */
  projectIdea?: string;
  requirementSummary?: string;
};

export type GenerateClientEstimateResponse = {
  consultationMode: ConsultationMode;
  estimatedHours: number;
  /** Null for MAINTENANCE — a support engagement has no delivery date. */
  estimatedWeeks: number | null;
  teamSize: number;
  complexity: FeatureComplexity;
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: Array<{ category: string; hours: number }>;
  /**
   * Recommended technology stack, grouped by category and in presentation order —
   * the deterministic engine's baseline with the AI's additions merged in.
   */
  techStack: TechStackGroup[];
  /** Final project cost from the Cost Engine (never the AI), or null on a pricing failure. */
  pricing: CostPreview | null;
  /** Exactly one is non-null, decided by consultationMode; NEW_PROJECT carries none. */
  maintenancePlan: ClientMaintenancePlan | null;
  migrationPlan: ClientMigrationPlan | null;
  enhancementImpact: ClientEnhancementImpact | null;
  /** Recurring monthly cost of a support engagement, priced from support hours/month. */
  monthlyPricing: CostPreview | null;
};

/** Effort + complexity for a live reprice — no features, no AI, just the Cost Engine. */
export type PriceClientEstimatePayload = {
  estimatedHours: number;
  complexity: FeatureComplexity;
  /** Wizard-selected platform labels — priced server-side by the Cost Engine. */
  platforms?: string[];
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

  /**
   * Reprices an already-generated estimate for a new hour total — the endpoint
   * behind the interactive Project Cost. Runs the same Cost Engine as `generate`,
   * never the AI, so toggling features is cheap and instant.
   */
  async price(payload: PriceClientEstimatePayload): Promise<CostPreview> {
    const response = await api.post<ApiSuccessResponse<CostPreview>>(
      "/api/client/estimate/price",
      payload,
    );
    return response.data.data;
  },
};
