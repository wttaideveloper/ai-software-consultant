export const PROMPT_TYPES = {
  CONSULTATION: "CONSULTATION",
  REQUIREMENT_EXTRACTION: "REQUIREMENT_EXTRACTION",
  FEATURE_DETECTION: "FEATURE_DETECTION",
  FEATURE_MATCHING: "FEATURE_MATCHING",
  REQUIREMENT_SUMMARY: "REQUIREMENT_SUMMARY",
  ESTIMATION: "ESTIMATION",
  PROPOSAL: "PROPOSAL",
  EMAIL: "EMAIL",
  MEETING_SUMMARY: "MEETING_SUMMARY",
  CLIENT_REQUIREMENT_DISCOVERY: "CLIENT_REQUIREMENT_DISCOVERY",
  /**
   * Plans which screens a concept-mockup batch should contain. A *text* call:
   * the image model renders one screen at a time and is never asked to decide
   * what the screens are, because naming and describing a coherent user journey
   * is a reasoning task it does poorly and cannot return as structured data.
   */
  CONCEPT_SCREENS: "CONCEPT_SCREENS",
} as const;

export type PromptType = (typeof PROMPT_TYPES)[keyof typeof PROMPT_TYPES];

export const PROMPT_DEFAULTS = {
  MAX_CONVERSATION_HISTORY: 20,
  DEFAULT_SYSTEM_ROLE: "system",
} as const;

export const RESERVED_TEMPLATE_VARIABLES = {
  ORGANIZATION_NAME: "organizationName",
  ORGANIZATION_ID: "organizationId",
  CONSULTATION_TITLE: "consultationTitle",
  CONSULTATION_ID: "consultationId",
  INDUSTRY: "industry",
  PROJECT_TYPE: "projectType",
  BUDGET_RANGE: "budgetRange",
  TIMELINE: "timeline",
  USER_MESSAGE: "userMessage",
  /**
   * The deterministic technology baseline the AI must enrich rather than replace.
   * Built by the tech-stack engine and supplied by the calling service — see
   * `buildEnrichmentDirective`. Empty when a caller has no project context to
   * analyse, which leaves the ESTIMATION prompt asking for a plain recommendation.
   */
  TECH_STACK_BASELINE: "techStackBaseline",
  /**
   * Consultation Mode. Expanded from a single `consultationMode` input by
   * PromptBuilder from CONSULTATION_MODE_PROFILES — callers never assemble these
   * strings themselves, which is what keeps the four engagement types defined in
   * exactly one place (consultation-mode.profiles.ts).
   */
  CONSULTATION_MODE: "consultationMode",
  MODE_LABEL: "modeLabel",
  MODE_CONTEXT: "modeContext",
  MODE_DISCOVERY_FOCUS: "modeDiscoveryFocus",
  MODE_DISCOVERY_DIRECTIVE: "modeDiscoveryDirective",
  MODE_SUMMARY_DIRECTIVE: "modeSummaryDirective",
  MODE_FEATURE_CATEGORIES: "modeFeatureCategories",
  MODE_FEATURE_DIRECTIVE: "modeFeatureDirective",
  MODE_ESTIMATION_DIRECTIVE: "modeEstimationDirective",
  MODE_TECH_STACK_DIRECTIVE: "modeTechStackDirective",
  MODE_PROPOSAL_TITLE: "modeProposalTitle",
  MODE_PROPOSAL_DIRECTIVE: "modeProposalDirective",
} as const;

export type ReservedTemplateVariable =
  (typeof RESERVED_TEMPLATE_VARIABLES)[keyof typeof RESERVED_TEMPLATE_VARIABLES];
