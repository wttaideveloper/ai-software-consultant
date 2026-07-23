import {
  costComplexityLevelEnum,
  costCurrencyEnum,
  costPlatformEnum,
  costRoleEnum,
} from "../../db/schema/enums.js";

export type CostRole = (typeof costRoleEnum.enumValues)[number];
export type CostComplexityLevel =
  (typeof costComplexityLevelEnum.enumValues)[number];
export type CostPlatform = (typeof costPlatformEnum.enumValues)[number];
export type CostCurrency = (typeof costCurrencyEnum.enumValues)[number];

/**
 * Defaults provisioned the first time an organization reads its cost settings.
 *
 * They are a starting point, not a recommendation — every value is editable, and
 * the point of this module is that changing them never requires a deploy. The
 * figures are the ones the module was specified with (INR, Indian market).
 */
export const DEFAULT_HOURLY_RATES: Record<CostRole, string> = {
  FRONTEND: "1200.00",
  BACKEND: "1500.00",
  UI_UX_DESIGN: "1000.00",
  QA_TESTING: "700.00",
  DEVOPS: "1300.00",
  PROJECT_MANAGEMENT: "1100.00",
  AI_DEVELOPMENT: "2000.00",
};

export const DEFAULT_COMPLEXITY_MULTIPLIERS: Record<CostComplexityLevel, string> = {
  SIMPLE: "1.000",
  MEDIUM: "1.200",
  COMPLEX: "1.500",
  ENTERPRISE: "2.000",
};

export const DEFAULT_PLATFORM_MULTIPLIERS: Record<CostPlatform, string> = {
  WEB: "1.000",
  ANDROID: "1.200",
  IOS: "1.200",
  DESKTOP: "1.100",
  ADMIN_PANEL: "1.000",
  API: "1.000",
  AI_INTEGRATION: "1.400",
};

/** Display symbol per supported currency. Stored on the settings row on change. */
export const CURRENCY_SYMBOLS: Record<CostCurrency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/**
 * The AI reports complexity as LOW/MEDIUM/HIGH (`feature_complexity`); pricing
 * has four tiers. This is the only place the two vocabularies meet.
 *
 * ENTERPRISE is deliberately unreachable from an AI signal: it is a commercial
 * judgement about the engagement, not something a model can infer from a
 * requirement summary, so it stays a manual override.
 */
export const AI_COMPLEXITY_TO_COST_LEVEL: Record<
  "LOW" | "MEDIUM" | "HIGH",
  CostComplexityLevel
> = {
  LOW: "SIMPLE",
  MEDIUM: "MEDIUM",
  HIGH: "COMPLEX",
};

/**
 * Free-text platform labels (from the Client Portal wizard and lead snapshots)
 * mapped onto the priced platform enum. Anything unrecognised is ignored rather
 * than silently priced as WEB — an unknown platform must not quietly change a
 * quote, and the resolver reports what it skipped.
 */
export const PLATFORM_LABEL_ALIASES: Record<string, CostPlatform> = {
  web: "WEB",
  website: "WEB",
  "web app": "WEB",
  "web application": "WEB",
  android: "ANDROID",
  "android app": "ANDROID",
  ios: "IOS",
  iphone: "IOS",
  "ios app": "IOS",
  mobile: "ANDROID",
  desktop: "DESKTOP",
  windows: "DESKTOP",
  macos: "DESKTOP",
  "admin panel": "ADMIN_PANEL",
  admin: "ADMIN_PANEL",
  dashboard: "ADMIN_PANEL",
  api: "API",
  backend: "API",
  "ai integration": "AI_INTEGRATION",
  ai: "AI_INTEGRATION",
};
