import { z } from "zod";

export const organizationSettingsUpdateSchema = z
  .object({
    language: z.string().trim().min(2).max(10),
    timezone: z.string().trim().min(1).max(64),
    onboardingCompleted: z.boolean(),
  })
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one setting must be provided",
  );

export type OrganizationSettingsUpdateInput = z.infer<
  typeof organizationSettingsUpdateSchema
>;

export const userSettingsUpdateSchema = z
  .object({
    language: z.string().trim().min(2).max(10),
    theme: z.enum(["light", "dark", "system"]),
    notificationsEnabled: z.boolean(),
  })
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one setting must be provided",
  );

export type UserSettingsUpdateInput = z.infer<typeof userSettingsUpdateSchema>;
