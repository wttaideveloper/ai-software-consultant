"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEstimationPayloadSchema = exports.updateEstimationSchema = exports.consultationIdParamsSchema = void 0;
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
exports.aiEstimationPayloadSchema = zod_1.z.object({
    estimatedHours: zod_1.z.number().positive(),
    estimatedWeeks: zod_1.z.number().positive(),
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
});
