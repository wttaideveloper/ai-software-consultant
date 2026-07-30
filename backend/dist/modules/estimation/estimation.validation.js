"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEstimationPayloadSchema = exports.enhancementImpactSchema = exports.migrationPlanSchema = exports.maintenancePlanSchema = exports.updateEstimationSchema = exports.consultationIdParamsSchema = void 0;
const zod_1 = require("zod");
exports.consultationIdParamsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
const breakdownItemSchema = zod_1.z.object({
    category: zod_1.z.string().trim().min(1),
    hours: zod_1.z.number().int().nonnegative(),
});
exports.updateEstimationSchema = zod_1.z
    .object({
    estimatedHours: zod_1.z.number().int().positive().optional(),
    estimatedWeeks: zod_1.z.number().int().positive().optional(),
    estimatedTeamSize: zod_1.z.number().int().positive().optional(),
    assumptions: zod_1.z.string().trim().min(1).optional(),
    risks: zod_1.z.array(zod_1.z.string().trim().min(1)).optional(),
    breakdown: zod_1.z.array(breakdownItemSchema).min(1).optional(),
})
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");
/**
 * The engagement-specific halves of an estimate.
 *
 * Exactly one of these is filled per estimate, decided by the consultation mode
 * (see consultation-mode.profiles.ts). All three are nullish-tolerant because a
 * model asked to leave two of them null must not fail validation for doing so,
 * and because an estimate produced before Consultation Mode existed has none.
 */
exports.maintenancePlanSchema = zod_1.z.object({
    engagementType: zod_1.z.enum(["ONE_TIME_FIX", "MONTHLY_RETAINER", "ONGOING_SUPPORT"]),
    supportHoursPerMonth: zod_1.z.number().positive(),
    priorityLevel: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    suggestedSla: zod_1.z.string().trim().min(1),
    supportScope: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
});
exports.migrationPlanSchema = zod_1.z.object({
    /**
     * The technologies being migrated AWAY from — the left-hand side of the
     * "current → recommended" comparison a migration client is shown.
     *
     * Optional and defaulted: a migration plan stored before this field existed,
     * or returned by a model that omits it, still validates and simply renders the
     * recommended stack alone. Descriptive only — nothing prices or schedules it.
     */
    currentStack: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
    phases: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().trim().min(1),
        description: zod_1.z.string().trim().min(1),
        hours: zod_1.z.number().nonnegative(),
    }))
        .min(1),
    rollbackStrategy: zod_1.z.string().trim().min(1),
    downtimeEstimate: zod_1.z.string().trim().min(1),
});
exports.enhancementImpactSchema = zod_1.z.object({
    impactAnalysis: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
    dependencies: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
    affectedModules: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
});
exports.aiEstimationPayloadSchema = zod_1.z.object({
    estimatedHours: zod_1.z.number().positive(),
    /**
     * Nullable because a MAINTENANCE engagement genuinely has no delivery
     * timeline — nothing ships on a date, so a number here would be invented. The
     * service re-imposes "must be present" for every other mode (see
     * assertEstimateMatchesMode), so this looseness cannot silently drop the
     * timeline from a real project estimate.
     */
    estimatedWeeks: zod_1.z.number().positive().nullish(),
    teamSize: zod_1.z.number().int().positive(),
    complexity: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]),
    confidence: zod_1.z.number().min(0).max(1),
    assumptions: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    risks: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    breakdown: zod_1.z.array(breakdownItemSchema).min(1),
    // Optional so responses from a model that omits it (or older cached ones) still
    // validate. The admin pipeline parses but does not persist it; the Client Portal
    // estimate surfaces it as the recommended technology stack.
    techStack: zod_1.z.array(zod_1.z.string().trim().min(1)).optional(),
    maintenancePlan: exports.maintenancePlanSchema.nullish(),
    migrationPlan: exports.migrationPlanSchema.nullish(),
    enhancementImpact: exports.enhancementImpactSchema.nullish(),
});
