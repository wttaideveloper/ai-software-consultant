import { z } from "zod";
import type { UserTheme } from "@/types";

// Mirrors organizationSettingsUpdateSchema on the backend exactly.
export const organizationSettingsFormSchema = z.object({
  language: z.string().trim().min(2, "Must be at least 2 characters").max(10),
  timezone: z.string().trim().min(1, "Timezone is required").max(64),
  onboardingCompleted: z.boolean(),
});

export type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsFormSchema>;

export const USER_THEME_OPTIONS: Array<{ label: string; value: UserTheme }> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

// Mirrors userSettingsUpdateSchema on the backend exactly.
export const userSettingsFormSchema = z.object({
  language: z.string().trim().min(2, "Must be at least 2 characters").max(10),
  theme: z.enum(["light", "dark", "system"]),
  notificationsEnabled: z.boolean(),
});

export type UserSettingsFormValues = z.infer<typeof userSettingsFormSchema>;
