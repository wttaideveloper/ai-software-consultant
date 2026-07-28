import type { CostPlatform } from "../cost/cost.constants.js";

/**
 * The vocabulary and shapes of the technology-stack engine.
 *
 * Deliberately separate from `tech-stack.constants.ts`: the constants file is a
 * ~1100-line catalogue typed *by* these definitions (`Record<TechCapability,
 * CategoryTechnologies>` and friends), so the two cannot live together without a
 * circular import. This file therefore holds only the dimensions the catalogue is
 * indexed by, plus the structures the engine passes around — no technology data.
 *
 * All four dimension enums follow the codebase's `as const` object + derived
 * union convention (see `PERMISSIONS`, `CONSULTATION_MODES`), which is what lets
 * `Object.values()` enumerate them at runtime while indexing stays type-safe.
 */

/**
 * Where a technology is presented. This is a *display* taxonomy, not a technical
 * one — it exists so a proposal groups "Stripe" under Payments rather than under
 * whichever layer it happens to run in.
 *
 * `OTHER` is the required escape hatch: the AI may name a technology the
 * catalogue has never heard of, and the engine's contract is that such a
 * technology is shown under Other rather than silently dropped.
 */
export const TECH_STACK_CATEGORIES = {
  FRONTEND: "FRONTEND",
  BACKEND: "BACKEND",
  DATABASE: "DATABASE",
  MOBILE: "MOBILE",
  IOS: "IOS",
  ANDROID: "ANDROID",
  DESKTOP: "DESKTOP",
  AUTHENTICATION: "AUTHENTICATION",
  PAYMENTS: "PAYMENTS",
  MAPS: "MAPS",
  NOTIFICATIONS: "NOTIFICATIONS",
  STORAGE: "STORAGE",
  MESSAGING: "MESSAGING",
  VIDEO: "VIDEO",
  AI: "AI",
  SEARCH: "SEARCH",
  ANALYTICS: "ANALYTICS",
  COMMUNICATIONS: "COMMUNICATIONS",
  INTEGRATIONS: "INTEGRATIONS",
  SECURITY: "SECURITY",
  DEPLOYMENT: "DEPLOYMENT",
  OTHER: "OTHER",
} as const;

export type TechStackCategory =
  (typeof TECH_STACK_CATEGORIES)[keyof typeof TECH_STACK_CATEGORIES];

/**
 * Product capabilities detected from what a project describes about itself.
 *
 * Each member is a keyword bucket in `CAPABILITY_KEYWORDS` and a technology
 * bundle in `CAPABILITY_TECHNOLOGIES`; both are `Record<TechCapability, …>`, so
 * adding a member here is a compile error until the catalogue covers it. That is
 * the intended safety property — a capability the engine can detect but has no
 * technologies for would silently contribute nothing.
 */
export const TECH_CAPABILITIES = {
  AUTHENTICATION: "AUTHENTICATION",
  PAYMENTS: "PAYMENTS",
  MAPS: "MAPS",
  NOTIFICATIONS: "NOTIFICATIONS",
  STORAGE: "STORAGE",
  UPLOADS: "UPLOADS",
  ANALYTICS: "ANALYTICS",
  REPORTING: "REPORTING",
  CHARTS: "CHARTS",
  CHAT: "CHAT",
  VIDEO: "VIDEO",
  AI: "AI",
  SEARCH: "SEARCH",
  EMAIL: "EMAIL",
  SMS: "SMS",
  REALTIME: "REALTIME",
  SCHEDULING: "SCHEDULING",
} as const;

export type TechCapability =
  (typeof TECH_CAPABILITIES)[keyof typeof TECH_CAPABILITIES];

/**
 * Domains with opinionated technology implications (FHIR for healthcare, PCI DSS
 * for fintech). Only ever one is applied per project — see `detectIndustry`.
 */
export const TECH_INDUSTRIES = {
  HEALTHCARE: "HEALTHCARE",
  FINTECH: "FINTECH",
  ECOMMERCE: "ECOMMERCE",
  TRAVEL: "TRAVEL",
  EDUCATION: "EDUCATION",
  CRM: "CRM",
  REAL_ESTATE: "REAL_ESTATE",
  FOOD_DELIVERY: "FOOD_DELIVERY",
  LOGISTICS: "LOGISTICS",
  MEDIA: "MEDIA",
} as const;

export type TechIndustry =
  (typeof TECH_INDUSTRIES)[keyof typeof TECH_INDUSTRIES];

/**
 * Effort bracket, which decides whether a project warrants the heavier tooling
 * (queues, caches, observability) that would be overkill on a small build.
 *
 * Resolved from estimated hours where one exists, and from the AI's complexity
 * signal before estimation has run — the baseline is buildable at any point in
 * the pipeline, so it cannot depend on the estimate existing.
 */
export const PROJECT_SIZES = {
  SMALL: "SMALL",
  MEDIUM: "MEDIUM",
  LARGE: "LARGE",
} as const;

export type ProjectSize = (typeof PROJECT_SIZES)[keyof typeof PROJECT_SIZES];

/**
 * One feature/work item as the engine reads it. Every field is optional because
 * this is fed from several sources — Client Portal features, admin
 * `detected_features` rows, and raw AI output — and the engine only ever
 * concatenates them into a keyword haystack.
 */
export type TechStackFeatureInput = {
  name?: string | null;
  category?: string | null;
  description?: string | null;
};

/**
 * Everything the engine is allowed to look at when deciding a stack.
 *
 * Entirely optional by design: a consultation early in the pipeline has a project
 * type and nothing else, while a finished Client Portal wizard has all of it. The
 * engine degrades — fewer signals mean a smaller baseline, never a failure.
 */
export type TechStackContext = {
  projectIdea?: string | null;
  requirementSummary?: string | null;
  industry?: string | null;
  projectType?: string | null;
  /** Explicit platform selections (e.g. "Web", "iOS App"); these outrank text detection. */
  platformLabels?: string[] | null;
  estimatedHours?: number | null;
  /** The AI's complexity signal, used to bracket size before an estimate exists. */
  complexity?: "LOW" | "MEDIUM" | "HIGH" | null;
  features?: TechStackFeatureInput[] | null;
};

/** What the engine concluded a project *is*, before any technology is chosen. */
export type TechStackAnalysis = {
  platforms: CostPlatform[];
  capabilities: TechCapability[];
  /** At most one — stacking several domains' technologies reads as noise. */
  industry: TechIndustry | null;
  projectSize: ProjectSize;
};

/**
 * One presented category and its technologies.
 *
 * `label` is always present on output (the engine re-derives it from
 * `TECH_STACK_CATEGORY_LABELS`) even though it is optional on the wire — see
 * `techStackGroupSchema`, which accepts a snapshot written before labels existed.
 */
export type TechStackGroup = {
  category: TechStackCategory;
  label: string;
  items: string[];
};

/**
 * The grouped stack, in presentation order, containing no duplicate technology
 * across groups.
 */
export type TechStack = TechStackGroup[];

/** The full engine output: what the project is, plus the stack that follows from it. */
export type TechStackRecommendation = TechStackAnalysis & {
  stack: TechStack;
};
