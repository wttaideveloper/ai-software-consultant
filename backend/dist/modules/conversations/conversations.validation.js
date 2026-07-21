"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMessageSchema = exports.createMessageSchema = exports.messageIdParamsSchema = exports.consultationIdParamsSchema = void 0;
const zod_1 = require("zod");
exports.consultationIdParamsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
exports.messageIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Message id must be a valid UUID"),
});
exports.createMessageSchema = zod_1.z.object({
    message: zod_1.z
        .string()
        .trim()
        .min(1, "Message is required")
        .max(10000, "Message must be at most 10000 characters"),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().nullable(),
});
exports.updateMessageSchema = zod_1.z.object({
    message: zod_1.z
        .string()
        .trim()
        .min(1, "Message is required")
        .max(10000, "Message must be at most 10000 characters"),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().nullable(),
});
