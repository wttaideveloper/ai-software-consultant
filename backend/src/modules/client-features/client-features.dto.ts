export type ClientDetectedFeatureDto = {
  name: string;
  category: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  complexity: "LOW" | "MEDIUM" | "HIGH";
};

export type ClientFeaturesResponseDto = {
  features: ClientDetectedFeatureDto[];
};
