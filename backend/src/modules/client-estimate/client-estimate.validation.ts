import { z } from "zod";
import { consultationModeSchema } from "../../shared/constants/consultation-mode.js";

const featureInputSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const generateClientEstimateSchema = z.object({
  consultationMode: consultationModeSchema,
  features: z.array(featureInputSchema).min(1, "At least one feature is required"),
  // Free-text platform labels from the wizard (e.g. "Web", "Android"), resolved
  // server-side via the Cost Engine's alias table to price the platform premium,
  // and — since the technology engine was wired in — to decide the technology
  // baseline. Optional: pricing simply omits the premium when none are provided.
  platforms: z.array(z.string().trim().min(1)).optional(),
  /**
   * Project context for the technology engine only. None of it reaches the
   * effort estimate, whose contract is deliberately "input: features" — it is
   * read by `analyzeProject` to detect the industry, capabilities and platforms
   * a stack has to cover. Optional so a client mid-wizard (or one running an
   * older bundle) still gets an estimate, with a smaller baseline.
   */
  projectIdea: z.string().trim().max(5000).optional(),
  requirementSummary: z.string().trim().max(20000).optional(),
});

export type GenerateClientEstimateInput = z.infer<typeof generateClientEstimateSchema>;

/**
 * Re-prices an already-generated estimate after the client toggles features on or
 * off. Carries only effort (hours + the unchanged complexity) and platforms — no
 * features, no AI: the same Cost Engine that priced the first estimate reprices the
 * new hour total. This is what makes the Project Cost interactive without a second
 * AI call.
 */
export const priceClientEstimateSchema = z.object({
  estimatedHours: z.number().positive(),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  platforms: z.array(z.string().trim().min(1)).optional(),
});

export type PriceClientEstimateInput = z.infer<typeof priceClientEstimateSchema>;
