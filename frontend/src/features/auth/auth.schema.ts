import { z } from "zod";

/**
 * Login only — this is an internal platform with no self-registration. Accounts
 * are provisioned by the backend admin seed or by an admin via Users, so the
 * password-creation policy lives in users.schema.ts, not here.
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
