"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiProposalPayloadSchema = exports.updateProposalSchema = exports.consultationIdParamsSchema = void 0;
const zod_1 = require("zod");
exports.consultationIdParamsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
const stringListSchema = zod_1.z.array(zod_1.z.string().trim().min(1)).min(1);
exports.updateProposalSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1).max(255).optional(),
    executiveSummary: zod_1.z.string().trim().min(1).optional(),
    scopeOfWork: stringListSchema.optional(),
    deliverables: stringListSchema.optional(),
    timeline: zod_1.z.string().trim().min(1).max(255).optional(),
    assumptions: zod_1.z.string().trim().min(1).optional(),
    exclusions: zod_1.z.string().trim().min(1).optional(),
    pricingNotes: zod_1.z.string().trim().min(1).optional(),
    proposalMarkdown: zod_1.z.string().trim().min(1).optional(),
    status: zod_1.z.enum(["DRAFT", "REVIEWED", "APPROVED"]).optional(),
})
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");
exports.aiProposalPayloadSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    executiveSummary: zod_1.z.string().min(1),
    scopeOfWork: stringListSchema,
    deliverables: stringListSchema,
    timeline: zod_1.z.string().min(1),
    assumptions: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    exclusions: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    pricingNotes: zod_1.z.string().min(1),
    proposalMarkdown: zod_1.z.string().min(1),
});
