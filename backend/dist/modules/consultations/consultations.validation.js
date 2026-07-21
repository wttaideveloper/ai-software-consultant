"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConsultationSchema = exports.createConsultationSchema = exports.listConsultationsQuerySchema = exports.consultationIdParamsSchema = exports.consultationStatuses = void 0;
const zod_1 = require("zod");
const app_js_1 = require("../../shared/constants/app.js");
exports.consultationStatuses = [
    "draft",
    "in_progress",
    "completed",
    "cancelled",
];
exports.consultationIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
exports.listConsultationsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .max(app_js_1.MAX_PAGE_SIZE)
        .default(app_js_1.DEFAULT_PAGE_SIZE),
    search: zod_1.z.string().trim().optional(),
    status: zod_1.z.enum(exports.consultationStatuses).optional(),
    assignedTo: zod_1.z.string().uuid("assignedTo must be a valid UUID").optional(),
});
exports.createConsultationSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(255, "Title must be at most 255 characters"),
    industry: zod_1.z.string().trim().max(128).nullish(),
    projectType: zod_1.z.string().trim().max(128).nullish(),
    budgetRange: zod_1.z.string().trim().max(128).nullish(),
    timeline: zod_1.z.string().trim().max(128).nullish(),
    assignedTo: zod_1.z.string().uuid("assignedTo must be a valid UUID").nullish(),
});
exports.updateConsultationSchema = zod_1.z
    .object({
    title: zod_1.z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(255, "Title must be at most 255 characters")
        .optional(),
    industry: zod_1.z.string().trim().max(128).nullish(),
    projectType: zod_1.z.string().trim().max(128).nullish(),
    budgetRange: zod_1.z.string().trim().max(128).nullish(),
    timeline: zod_1.z.string().trim().max(128).nullish(),
    status: zod_1.z.enum(exports.consultationStatuses).optional(),
    assignedTo: zod_1.z.string().uuid("assignedTo must be a valid UUID").nullish(),
})
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");
