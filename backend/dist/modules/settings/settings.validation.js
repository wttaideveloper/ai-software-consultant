"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettingsUpdateSchema = exports.organizationSettingsUpdateSchema = void 0;
const zod_1 = require("zod");
exports.organizationSettingsUpdateSchema = zod_1.z
    .object({
    language: zod_1.z.string().trim().min(2).max(10),
    timezone: zod_1.z.string().trim().min(1).max(64),
    onboardingCompleted: zod_1.z.boolean(),
})
    .partial()
    .strict()
    .refine((value) => Object.keys(value).length > 0, "At least one setting must be provided");
exports.userSettingsUpdateSchema = zod_1.z
    .object({
    language: zod_1.z.string().trim().min(2).max(10),
    theme: zod_1.z.enum(["light", "dark", "system"]),
    notificationsEnabled: zod_1.z.boolean(),
})
    .partial()
    .strict()
    .refine((value) => Object.keys(value).length > 0, "At least one setting must be provided");
