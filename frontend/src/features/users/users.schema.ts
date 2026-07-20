import { z } from "zod";
import type { UserStatus } from "@/types";

/** Mirrors the password policy enforced server-side in users.validation.ts. */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Add at least 1 uppercase letter")
  .regex(/[a-z]/, "Add at least 1 lowercase letter")
  .regex(/[0-9]/, "Add at least 1 number")
  .regex(/[^A-Za-z0-9]/, "Add at least 1 special character");

export const USER_STATUS_OPTIONS: Array<{ label: string; value: UserStatus }> = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

// updateUserSchema on the backend has no email/password field — email is
// immutable after creation and there is no password-reset endpoint, so the
// create and edit forms use genuinely different field sets/schemas.

export const createUserFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must be at most 100 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: passwordSchema,
  phone: z.string().trim().max(64).optional(),
  roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const editUserFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must be at most 100 characters"),
  phone: z.string().trim().max(64).optional(),
  status: z.enum(["active", "inactive", "suspended"]),
  roleIds: z.array(z.string()).min(1, "Select at least one role"),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;
