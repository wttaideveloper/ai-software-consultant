import type { CostPreviewDto } from "../cost/cost.dto.js";

export type ClientEstimateBreakdownItem = {
  category: string;
  hours: number;
};

export type ClientEstimateResponseDto = {
  estimatedHours: number;
  estimatedWeeks: number;
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
};
