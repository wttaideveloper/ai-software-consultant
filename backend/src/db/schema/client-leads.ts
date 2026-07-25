import { jsonb, index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import {
  clientLeadStatusEnum,
  clientPreferredContactMethodEnum,
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

/** Snapshot of the client's estimate at submission time — mirrors the reused Estimation AI contract. */
export type ClientLeadEstimate = {
  estimatedHours: number;
  estimatedWeeks: number;
  teamSize: number;
  complexity: (typeof featureComplexityEnum.enumValues)[number];
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: ClientLeadEstimateBreakdownItem[];
};

/** The Cost Engine breakdown the client was shown — stored verbatim (see ClientLeadPricing). */
export type ClientLeadPricingBreakdown = {
  estimatedHours: number;
  hourlyRate: number;
  complexityMultiplier: number;
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
    techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
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
