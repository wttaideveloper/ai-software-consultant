"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRequirementSummaryPayloadSchema = exports.updateRequirementSummarySchema = exports.requirementSummaryParamsSchema = void 0;
const zod_1 = require("zod");
exports.requirementSummaryParamsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
const structuredSummarySchema = zod_1.z.object({
    projectName: zod_1.z.string(),
    projectType: zod_1.z.string(),
    businessGoals: zod_1.z.array(zod_1.z.string()),
    targetUsers: zod_1.z.array(zod_1.z.string()),
    coreFeatures: zod_1.z.array(zod_1.z.string()),
    adminFeatures: zod_1.z.array(zod_1.z.string()),
    integrations: zod_1.z.array(zod_1.z.string()),
    nonFunctionalRequirements: zod_1.z.array(zod_1.z.string()),
    assumptions: zod_1.z.array(zod_1.z.string()),
    openQuestions: zod_1.z.array(zod_1.z.string()),
});
exports.updateRequirementSummarySchema = zod_1.z
    .object({
    summaryMarkdown: zod_1.z.string().trim().min(1).optional(),
    structuredSummary: structuredSummarySchema.optional(),
    status: zod_1.z.enum(["draft", "finalized"]).optional(),
})
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");
exports.aiRequirementSummaryPayloadSchema = zod_1.z.object({
    summaryMarkdown: zod_1.z.string().min(1),
    structuredSummary: structuredSummarySchema,
});
