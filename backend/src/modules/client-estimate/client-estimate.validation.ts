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
  // Free-text platform labels from the wizard (e.g. "Web", "Android"), resolved
  // server-side via the Cost Engine's alias table to price the platform premium.
  // Optional: pricing simply omits the premium when none are provided.
  platforms: z.array(z.string().trim().min(1)).optional(),
});

export type GenerateClientEstimateInput = z.infer<typeof generateClientEstimateSchema>;
