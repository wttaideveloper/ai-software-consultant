import type {
  EstimationBreakdownItem,
  EstimationModePlan,
  EstimationRisk,
} from "../../db/schema/project-estimations.js";
import type { CostPreviewDto } from "../cost/cost.dto.js";

export type EstimationDto = {
  id: string;
  organizationId: string;
  consultationId: string;
  requirementSummaryId: string;
  estimatedHours: number;
  /** Null for a MAINTENANCE engagement — no delivery date exists to report. */
  estimatedWeeks: number | null;
  /** Engagement-specific detail; null for NEW_PROJECT and pre-mode estimates. */
  modePlan: EstimationModePlan | null;
  estimatedTeamSize: number;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  confidenceScore: number;
  assumptions: string;
  risks: EstimationRisk[];
  breakdown: EstimationBreakdownItem[];
  generatedBy: "AI" | "USER";
  version: number;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Project pricing, calculated by the Cost Management engine from the effort
   * above — never returned by the AI, which is only ever asked for effort.
   *
   * Derived at read time rather than stored: a rate-card change must reprice
   * open estimates, and freezing a price is the proposal's job, not the
   * estimate's. Null only when pricing itself failed, so a broken rate card
   * degrades the screen instead of breaking the estimate.
   */
  pricing: CostPreviewDto | null;
};
