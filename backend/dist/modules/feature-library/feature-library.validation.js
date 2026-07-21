"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiFeatureMatchingPayloadSchema = exports.matchDetectedFeaturesSchema = exports.updateFeatureLibrarySchema = exports.createFeatureLibrarySchema = exports.listFeatureLibraryQuerySchema = exports.featureLibraryIdParamsSchema = void 0;
const zod_1 = require("zod");
const app_js_1 = require("../../shared/constants/app.js");
exports.featureLibraryIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Feature library id must be a valid UUID"),
});
exports.listFeatureLibraryQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .max(app_js_1.MAX_PAGE_SIZE)
        .default(app_js_1.DEFAULT_PAGE_SIZE),
    name: zod_1.z.string().trim().min(1).optional(),
    category: zod_1.z.string().trim().min(1).optional(),
    tag: zod_1.z.string().trim().min(1).optional(),
    isActive: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((value) => value === undefined ? undefined : value === "true"),
});
exports.createFeatureLibrarySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(255),
    category: zod_1.z.string().trim().min(1).max(128),
    description: zod_1.z.string().trim().min(1),
    defaultComplexity: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]),
    defaultEstimatedHours: zod_1.z.number().int().positive(),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
    technologies: zod_1.z.array(zod_1.z.string().trim().min(1)).default([]),
    notes: zod_1.z.string().trim().min(1).nullish(),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateFeatureLibrarySchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(255).optional(),
    category: zod_1.z.string().trim().min(1).max(128).optional(),
    description: zod_1.z.string().trim().min(1).optional(),
    defaultComplexity: zod_1.z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    defaultEstimatedHours: zod_1.z.number().int().positive().optional(),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1)).optional(),
    technologies: zod_1.z.array(zod_1.z.string().trim().min(1)).optional(),
    notes: zod_1.z.string().trim().min(1).nullish(),
    isActive: zod_1.z.boolean().optional(),
})
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");
exports.matchDetectedFeaturesSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
exports.aiFeatureMatchingPayloadSchema = zod_1.z.object({
    matches: zod_1.z.array(zod_1.z.object({
        detectedFeatureId: zod_1.z.string().uuid(),
        libraryFeatureId: zod_1.z.string().uuid().nullable(),
        confidence: zod_1.z.number().min(0).max(1),
        recommendation: zod_1.z.string().min(1),
    })),
});
