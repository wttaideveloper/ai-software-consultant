import { z } from "zod";

export const consultationIdParamsSchema = z.object({
  consultationId: z.string().uuid("Consultation id must be a valid UUID"),
});

const breakdownItemSchema = z.object({
  category: z.string().trim().min(1),
  hours: z.number().int().nonnegative(),
});

export const updateEstimationSchema = z
  .object({
    estimatedHours: z.number().int().positive().optional(),
    estimatedWeeks: z.number().int().positive().optional(),
    estimatedTeamSize: z.number().int().positive().optional(),
    assumptions: z.string().trim().min(1).optional(),
    risks: z.array(z.string().trim().min(1)).optional(),
    breakdown: z.array(breakdownItemSchema).min(1).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  );

export type UpdateEstimationInput = z.infer<typeof updateEstimationSchema>;

export const aiEstimationPayloadSchema = z.object({
  estimatedHours: z.number().positive(),
  estimatedWeeks: z.number().positive(),
  teamSize: z.number().int().positive(),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string().min(1)).min(1),
  risks: z.array(z.string().min(1)).min(1),
  breakdown: z.array(breakdownItemSchema).min(1),
  // Optional so responses from a model that omits it (or older cached ones) still
  // validate. The admin pipeline parses but does not persist it; the Client Portal
  // estimate surfaces it as the recommended technology stack.
  techStack: z.array(z.string().trim().min(1)).optional(),
});
