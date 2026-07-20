export type EstimationComplexity = "LOW" | "MEDIUM" | "HIGH";
export type EstimationGeneratedBy = "AI" | "USER";

export type EstimationBreakdownItem = {
  category: string;
  hours: number;
};

export type Estimation = {
  id: string;
  organizationId: string;
  consultationId: string;
  requirementSummaryId: string;
  estimatedHours: number;
  estimatedWeeks: number;
  estimatedTeamSize: number;
  complexity: EstimationComplexity;
  confidenceScore: number;
  /** Newline-joined string, not an array — matches the backend column. */
  assumptions: string;
  risks: string[];
  breakdown: EstimationBreakdownItem[];
  generatedBy: EstimationGeneratedBy;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateEstimationPayload = {
  estimatedHours?: number;
  estimatedWeeks?: number;
  estimatedTeamSize?: number;
  assumptions?: string;
  risks?: string[];
  breakdown?: EstimationBreakdownItem[];
};
