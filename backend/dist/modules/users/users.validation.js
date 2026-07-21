"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.listUsersQuerySchema = exports.userIdParamsSchema = void 0;
const zod_1 = require("zod");
const app_js_1 = require("../../shared/constants/app.js");
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");
exports.userIdParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("User id must be a valid UUID"),
});
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .max(app_js_1.MAX_PAGE_SIZE)
        .default(app_js_1.DEFAULT_PAGE_SIZE),
    search: zod_1.z.string().trim().optional(),
});
exports.createUserSchema = zod_1.z.object({
    fullName: zod_1.z
        .string()
        .trim()
        .min(3, "Full name must be at least 3 characters")
        .max(100, "Full name must be at most 100 characters"),
    email: zod_1.z.string().trim().email("Email must be a valid email address"),
    password: passwordSchema,
    phone: zod_1.z.string().trim().max(64).nullish(),
    avatarUrl: zod_1.z
        .union([zod_1.z.string().trim().url("Avatar URL must be valid"), zod_1.z.null()])
        .optional(),
    roleIds: zod_1.z
        .array(zod_1.z.string().uuid("Role id must be a valid UUID"))
        .min(1, "At least one role is required"),
});
exports.updateUserSchema = zod_1.z
    .object({
    fullName: zod_1.z
        .string()
        .trim()
        .min(3, "Full name must be at least 3 characters")
        .max(100, "Full name must be at most 100 characters")
        .optional(),
    phone: zod_1.z.string().trim().max(64).nullish(),
    avatarUrl: zod_1.z
        .union([zod_1.z.string().trim().url("Avatar URL must be valid"), zod_1.z.null()])
        .optional(),
    status: zod_1.z.enum(["active", "inactive", "suspended"]).optional(),
    roleIds: zod_1.z
        .array(zod_1.z.string().uuid("Role id must be a valid UUID"))
        .min(1, "At least one role is required")
        .optional(),
})
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");
