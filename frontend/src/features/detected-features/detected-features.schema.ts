import { z } from "zod";

export const featureEditSchema = z.object({
  featureName: z.string().trim().min(1, "Feature name is required").max(255),
  featureCategory: z.string().trim().min(1, "Category is required").max(128),
  description: z.string().trim().min(1, "Description is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  manuallyVerified: z.boolean(),
});

export type FeatureEditValues = z.infer<typeof featureEditSchema>;
