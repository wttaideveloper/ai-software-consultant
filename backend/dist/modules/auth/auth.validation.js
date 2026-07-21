"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");
exports.registerSchema = zod_1.z.object({
    organizationName: zod_1.z
        .string()
        .trim()
        .min(3, "Organization name must be at least 3 characters")
        .max(100, "Organization name must be at most 100 characters"),
    fullName: zod_1.z
        .string()
        .trim()
        .min(3, "Full name must be at least 3 characters")
        .max(100, "Full name must be at most 100 characters"),
    email: zod_1.z.string().trim().email("Email must be a valid email address"),
    password: passwordSchema,
});
