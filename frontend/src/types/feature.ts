export type FeaturePriority = "HIGH" | "MEDIUM" | "LOW";
export type FeatureComplexity = "LOW" | "MEDIUM" | "HIGH";

export type DetectedFeature = {
  id: string;
  organizationId: string;
  consultationId: string;
  requirementSummaryId: string;
  featureName: string;
  featureCategory: string;
  description: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
  confidenceScore: number;
  aiReasoning: string;
  manuallyVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeatureGroup = {
  category: string;
  features: DetectedFeature[];
};

export type DetectedFeaturesResponse = {
  consultationId: string;
  total: number;
  groups: FeatureGroup[];
};

export type UpdateFeaturePayload = {
  featureName?: string;
  featureCategory?: string;
  description?: string;
  priority?: FeaturePriority;
  complexity?: FeatureComplexity;
  manuallyVerified?: boolean;
};
