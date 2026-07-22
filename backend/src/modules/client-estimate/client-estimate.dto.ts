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
};
