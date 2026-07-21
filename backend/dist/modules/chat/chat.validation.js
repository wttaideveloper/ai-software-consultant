"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatBodySchema = exports.chatParamsSchema = void 0;
const zod_1 = require("zod");
exports.chatParamsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
exports.chatBodySchema = zod_1.z.object({
    message: zod_1.z
        .string()
        .trim()
        .min(1, "Message is required")
        .max(10000, "Message must be at most 10000 characters"),
});
