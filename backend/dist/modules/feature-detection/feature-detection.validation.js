"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiDetectedFeaturesPayloadSchema = exports.updateFeatureSchema = exports.featureIdParamsSchema = exports.consultationIdParamsSchema = void 0;
const zod_1 = require("zod");
exports.consultationIdParamsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
exports.featureIdParamsSchema = zod_1.z.object({
    featureId: zod_1.z.string().uuid("Feature id must be a valid UUID"),
});
exports.updateFeatureSchema = zod_1.z
    .object({
    featureName: zod_1.z.string().trim().min(1).max(255).optional(),
    featureCategory: zod_1.z.string().trim().min(1).max(128).optional(),
    description: zod_1.z.string().trim().min(1).optional(),
    priority: zod_1.z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    complexity: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    manuallyVerified: zod_1.z.boolean().optional(),
})
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");
exports.aiDetectedFeaturesPayloadSchema = zod_1.z.object({
    features: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1),
        category: zod_1.z.string().min(1),
        description: zod_1.z.string().min(1),
        priority: zod_1.z.enum(["HIGH", "MEDIUM", "LOW"]),
        complexity: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]),
        confidence: zod_1.z.number().min(0).max(1),
        reasoning: zod_1.z.string().min(1),
    }))
        .min(1),
});
