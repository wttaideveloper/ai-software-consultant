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

/**
 * The engagement-specific halves of an estimate.
 *
 * Exactly one of these is filled per estimate, decided by the consultation mode
 * (see consultation-mode.profiles.ts). All three are nullish-tolerant because a
 * model asked to leave two of them null must not fail validation for doing so,
 * and because an estimate produced before Consultation Mode existed has none.
 */
export const maintenancePlanSchema = z.object({
  engagementType: z.enum(["ONE_TIME_FIX", "MONTHLY_RETAINER", "ONGOING_SUPPORT"]),
  supportHoursPerMonth: z.number().positive(),
  priorityLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  suggestedSla: z.string().trim().min(1),
  supportScope: z.array(z.string().trim().min(1)).default([]),
});

export const migrationPlanSchema = z.object({
  phases: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        description: z.string().trim().min(1),
        hours: z.number().nonnegative(),
      }),
    )
    .min(1),
  rollbackStrategy: z.string().trim().min(1),
  downtimeEstimate: z.string().trim().min(1),
});

export const enhancementImpactSchema = z.object({
  impactAnalysis: z.array(z.string().trim().min(1)).default([]),
  dependencies: z.array(z.string().trim().min(1)).default([]),
  affectedModules: z.array(z.string().trim().min(1)).default([]),
});

export const aiEstimationPayloadSchema = z.object({
  estimatedHours: z.number().positive(),
  /**
   * Nullable because a MAINTENANCE engagement genuinely has no delivery
   * timeline — nothing ships on a date, so a number here would be invented. The
   * service re-imposes "must be present" for every other mode (see
   * assertEstimateMatchesMode), so this looseness cannot silently drop the
   * timeline from a real project estimate.
   */
  estimatedWeeks: z.number().positive().nullish(),
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
  maintenancePlan: maintenancePlanSchema.nullish(),
  migrationPlan: migrationPlanSchema.nullish(),
  enhancementImpact: enhancementImpactSchema.nullish(),
});

export type AiMaintenancePlan = z.infer<typeof maintenancePlanSchema>;
export type AiMigrationPlan = z.infer<typeof migrationPlanSchema>;
export type AiEnhancementImpact = z.infer<typeof enhancementImpactSchema>;
export type AiEstimationPayload = z.infer<typeof aiEstimationPayloadSchema>;
