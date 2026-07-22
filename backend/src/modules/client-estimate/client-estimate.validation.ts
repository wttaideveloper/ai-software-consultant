import { z } from "zod";

const featureInputSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const generateClientEstimateSchema = z.object({
  features: z.array(featureInputSchema).min(1, "At least one feature is required"),
});

export type GenerateClientEstimateInput = z.infer<typeof generateClientEstimateSchema>;
