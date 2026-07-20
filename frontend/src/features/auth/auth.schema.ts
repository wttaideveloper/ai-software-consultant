import { z } from "zod";

/** Mirrors the password policy enforced server-side in auth.validation.ts. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Add at least 1 uppercase letter")
  .regex(/[a-z]/, "Add at least 1 lowercase letter")
  .regex(/[0-9]/, "Add at least 1 number")
  .regex(/[^A-Za-z0-9]/, "Add at least 1 special character");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(3, "Organization name must be at least 3 characters")
      .max(100, "Organization name must be at most 100 characters"),
    fullName: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters")
      .max(100, "Full name must be at most 100 characters"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const REGISTER_STEPS = ["Organization", "Admin account", "Review"] as const;

export const REGISTER_STEP_FIELDS: (keyof RegisterFormValues)[][] = [
  ["organizationName"],
  ["fullName", "email", "password", "confirmPassword"],
  [],
];
