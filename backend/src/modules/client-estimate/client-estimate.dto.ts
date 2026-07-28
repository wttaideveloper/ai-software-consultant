import type { ConsultationMode } from "../../shared/constants/consultation-mode.js";
import type { CostPreviewDto } from "../cost/cost.dto.js";
import type {
  AiEnhancementImpact,
  AiMaintenancePlan,
  AiMigrationPlan,
} from "../estimation/estimation.validation.js";

export type ClientEstimateBreakdownItem = {
  category: string;
  hours: number;
};

export type ClientEstimateResponseDto = {
  /** Echoed back so the client renders the estimate in the shape it asked for. */
  consultationMode: ConsultationMode;
  estimatedHours: number;
  /**
   * Null for a MAINTENANCE engagement, which has no delivery date — see
   * estimation.mode.ts. Always a number for the other three modes.
   */
  estimatedWeeks: number | null;
  teamSize: number;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: ClientEstimateBreakdownItem[];
  /** Recommended technology stack from the AI, or null when it returned none. */
  techStack: string[] | null;
  /**
   * The final project cost, priced from the platform owner's rate card by the
   * Cost Engine — never asked of the AI. Null when pricing could not be produced
   * (no organization provisioned, or a misconfigured rate card), so the estimate
   * still renders without a price.
   */
  pricing: CostPreviewDto | null;
  /**
   * Engagement-specific detail. Exactly one is non-null, decided by
   * `consultationMode`; NEW_PROJECT carries none.
   */
  maintenancePlan: AiMaintenancePlan | null;
  migrationPlan: AiMigrationPlan | null;
  enhancementImpact: AiEnhancementImpact | null;
  /**
   * The recurring monthly cost of a support engagement, priced by the same Cost
   * Engine from `maintenancePlan.supportHoursPerMonth`. Non-null only for
   * MAINTENANCE — every other mode quotes a one-off project cost in `pricing`.
   */
  monthlyPricing: CostPreviewDto | null;
};
