import { DEFAULT_LANGUAGE, TIMEZONE } from "../../shared/constants/app.js";

// Matches the keys/values already written once at registration in
// auth.service.ts / auth.repository.ts — this module reads and updates
// exactly those rows, it does not introduce new ones.
export const SETTINGS_KEYS = {
  ORGANIZATION_GENERAL: "general",
  USER_PREFERENCES: "preferences",
} as const;

export const DEFAULT_ORGANIZATION_SETTINGS = {
  language: DEFAULT_LANGUAGE,
  timezone: TIMEZONE,
  onboardingCompleted: false,
} as const;

export const DEFAULT_USER_SETTINGS = {
  language: DEFAULT_LANGUAGE,
  theme: "system",
  notificationsEnabled: true,
} as const;
