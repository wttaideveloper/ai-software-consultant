import { jsonb, index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import {
  clientLeadStatusEnum,
  clientPreferredContactMethodEnum,
  consultationModeEnum,
  featureComplexityEnum,
  featurePriorityEnum,
} from "./enums.js";
import { createdAt, deletedAt, updatedAt } from "./helpers.js";

/**
 * A snapshot of one edited feature at the moment the lead was submitted — not a
 * live reference to any admin-side detected_features row, since none exists here.
 */
export type ClientLeadFeature = {
  name: string;
  category: string;
  description: string;
  priority: (typeof featurePriorityEnum.enumValues)[number];
  complexity: (typeof featureComplexityEnum.enumValues)[number];
  included: boolean;
};

export type ClientLeadEstimateBreakdownItem = {
  category: string;
  hours: number;
};

/**
 * The mode-specific halves of an estimate, frozen exactly as the client saw them.
 *
 * Each is present only for the consultation mode that produces it, so all three
 * are optional: a NEW_PROJECT lead carries none of them, and every lead submitted
 * before Consultation Mode shipped carries none either. Field types are widened
 * to plain strings for the same reason ClientLeadPricing widens its enums — this
 * is a historical record, not a live typed value.
 */
export type ClientLeadMaintenancePlan = {
  engagementType: string;
  supportHoursPerMonth: number;
  priorityLevel: string;
  suggestedSla: string;
  supportScope: string[];
};

export type ClientLeadMigrationPhase = {
  name: string;
  description: string;
  hours: number;
};

export type ClientLeadMigrationPlan = {
  phases: ClientLeadMigrationPhase[];
  rollbackStrategy: string;
  downtimeEstimate: string;
};

export type ClientLeadEnhancementImpact = {
  impactAnalysis: string[];
  dependencies: string[];
  affectedModules: string[];
};

/**
 * Snapshot of the client's estimate at submission time — mirrors the reused
 * Estimation AI contract.
 *
 * `estimatedWeeks` is nullable because a MAINTENANCE engagement deliberately has
 * no delivery timeline: there is nothing being delivered on a date, so a number
 * there would be fabricated. Leads from the other three modes always carry one.
 */
export type ClientLeadEstimate = {
  estimatedHours: number;
  estimatedWeeks: number | null;
  teamSize: number;
  complexity: (typeof featureComplexityEnum.enumValues)[number];
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: ClientLeadEstimateBreakdownItem[];
  maintenancePlan?: ClientLeadMaintenancePlan | null;
  migrationPlan?: ClientLeadMigrationPlan | null;
  enhancementImpact?: ClientLeadEnhancementImpact | null;
};

/**
 * One category of the technology stack the client was shown.
 *
 * Widened to plain strings for the same reason ClientLeadPricing widens its
 * enums: this is a historical record, not a live typed value. A stored group's
 * `category` is whatever the engine emitted at submission time, and a category
 * later renamed in code must not make an old lead unreadable.
 */
export type ClientLeadTechStackGroup = {
  category: string;
  /**
   * Optional because the wire schema deliberately accepts a group without one
   * (`techStackGroupSchema`) and the engine re-derives the canonical label on
   * read. Requiring it here would reject a payload the API layer just accepted.
   */
  label?: string;
  items: string[];
};

/**
 * Grouped from the day the technology engine was wired in; a flat `string[]` on
 * every lead submitted before that.
 *
 * Both shapes are kept readable rather than backfilled — `normalizeTechStack`
 * converts the legacy form on read, so an old lead renders grouped without its
 * stored row ever being rewritten.
 */
export type ClientLeadTechStack = string[] | ClientLeadTechStackGroup[];

/** The Cost Engine breakdown the client was shown — stored verbatim (see ClientLeadPricing). */
export type ClientLeadPricingBreakdown = {
  estimatedHours: number;
  hourlyRate: number;
  /**
   * @deprecated Present only on leads submitted before complexity multipliers
   * were removed from the pricing engine. Never written for new leads, and never
   * read — kept optional so historical snapshots stay readable exactly as quoted.
   */
  complexityMultiplier?: number;
  platformMultiplier: number;
  baseCost: number;
  developmentCost: number;
  riskBufferPercentage: number;
  riskBufferAmount: number;
  subtotal: number;
  discountAmount: number;
  discountCapped: boolean;
  taxPercentage: number;
  taxAmount: number;
  finalPrice: number;
};

/**
 * Snapshot of the project cost the client saw at submission, exactly as the Cost
 * Engine priced it then. Stored verbatim and never recomputed: a later rate-card
 * change must not move a historical quote. The enum-like fields are widened to
 * `string` on purpose — this is a frozen record, not a live typed value, so it
 * stays readable even if the cost vocabularies evolve. Null for leads submitted
 * before this snapshot existed, or when pricing could not be produced.
 */
export type ClientLeadPricing = {
  currency: string;
  currencySymbol: string;
  complexityLevel: string;
  platforms: string[];
  unpricedPlatforms: string[];
  rateBasis: "EXPLICIT" | "ROLE" | "BLENDED";
  breakdown: ClientLeadPricingBreakdown;
};

/**
 * No organizationId: unlike every other table in this schema, a Client Portal lead
 * has no tenant to scope to — the portal is a single, unauthenticated public front
 * door with no organization/domain resolution built (a pre-existing gap across the
 * whole Client Portal, not introduced here). This table is intentionally a top-level,
 * tenant-independent entity; assigning leads to a specific organization is a future
 * decision for whoever builds the Admin-side lead management UI, not fabricated here.
 */
export const clientLeads = pgTable(
  "client_leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    company: varchar("company", { length: 255 }),
    phone: varchar("phone", { length: 64 }),
    whatsapp: varchar("whatsapp", { length: 64 }),
    country: varchar("country", { length: 128 }),
    preferredContactMethod: clientPreferredContactMethodEnum(
      "preferred_contact_method",
    )
      .notNull()
      .default("EMAIL"),
    notes: text("notes"),

    /**
     * The engagement type this request was captured under. Persisted on the lead
     * (not just used transiently by the portal) so the Admin can see which kind of
     * engagement a request is, and so the proposal generated from it picks the
     * right template. Defaulted for leads submitted before the feature existed.
     */
    consultationMode: consultationModeEnum("consultation_mode")
      .notNull()
      .default("NEW_PROJECT"),

    projectIdea: text("project_idea").notNull(),
    consultationTime: varchar("consultation_time", { length: 32 }).notNull(),
    platforms: jsonb("platforms").$type<string[]>().notNull().default([]),
    otherPlatform: varchar("other_platform", { length: 255 }),

    requirementSummary: text("requirement_summary").notNull(),
    features: jsonb("features").$type<ClientLeadFeature[]>().notNull(),
    estimate: jsonb("estimate").$type<ClientLeadEstimate>().notNull(),
    // Snapshot extras added alongside estimate — the exact project cost and tech
    // stack the client saw. Nullable/defaulted so pre-existing leads are valid
    // without a backfill; they simply render "not available".
    techStack: jsonb("tech_stack").$type<ClientLeadTechStack>().notNull().default([]),
    pricing: jsonb("pricing").$type<ClientLeadPricing>(),

    status: clientLeadStatusEnum("status").notNull().default("NEW"),

    createdAt,
    updatedAt,
    deletedAt,
  },
  (table) => [
    index("client_leads_email_idx").on(table.email),
    index("client_leads_status_idx").on(table.status),
    index("client_leads_created_at_idx").on(table.createdAt),
  ],
);
