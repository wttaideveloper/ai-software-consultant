import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { consultations } from "./consultations.js";
import {
  featureComplexityEnum,
  requirementSummaryGeneratedByEnum,
} from "./enums.js";
import { createdAt, deletedAt, updatedAt } from "./helpers.js";
import { organizations } from "./organizations.js";
import { requirementSummaries } from "./requirement-summaries.js";

export type EstimationRisk = string;

export type EstimationBreakdownItem = {
  category: string;
  hours: number;
};

/**
 * The engagement-specific half of an estimate, stored as one nullable jsonb
 * column rather than a dozen typed columns.
 *
 * The three shapes are mutually exclusive (decided by the consultation's mode)
 * and are read as a unit for display, never queried or aggregated on — which is
 * exactly the case jsonb is for. Typed columns would mean nine nullable fields,
 * eight of which are always null, plus a migration for every future mode.
 */
export type EstimationModePlan = {
  maintenancePlan?: {
    engagementType: string;
    supportHoursPerMonth: number;
    priorityLevel: string;
    suggestedSla: string;
    supportScope: string[];
  } | null;
  migrationPlan?: {
    phases: Array<{ name: string; description: string; hours: number }>;
    rollbackStrategy: string;
    downtimeEstimate: string;
  } | null;
  enhancementImpact?: {
    impactAnalysis: string[];
    dependencies: string[];
    affectedModules: string[];
  } | null;
};

export const projectEstimations = pgTable(
  "project_estimations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id, { onDelete: "cascade" }),
    requirementSummaryId: uuid("requirement_summary_id")
      .notNull()
      .references(() => requirementSummaries.id, { onDelete: "cascade" }),
    estimatedHours: integer("estimated_hours").notNull(),
    /**
     * Nullable since Consultation Mode: a MAINTENANCE engagement has no delivery
     * date, so a number here would be fabricated. Every other mode still writes
     * one, enforced in code by estimation.mode.ts rather than by the column.
     */
    estimatedWeeks: integer("estimated_weeks"),
    estimatedTeamSize: integer("estimated_team_size").notNull(),
    complexity: featureComplexityEnum("complexity").notNull(),
    confidenceScore: numeric("confidence_score", {
      precision: 5,
      scale: 4,
    }).notNull(),
    assumptions: text("assumptions").notNull(),
    risks: jsonb("risks").$type<EstimationRisk[]>().notNull(),
    breakdown: jsonb("breakdown").$type<EstimationBreakdownItem[]>().notNull(),
    /** Null for NEW_PROJECT and for every estimate produced before Consultation Mode. */
    modePlan: jsonb("mode_plan").$type<EstimationModePlan>(),
    generatedBy: requirementSummaryGeneratedByEnum("generated_by")
      .notNull()
      .default("AI"),
    version: integer("version").notNull().default(1),
    createdAt,
    updatedAt,
    deletedAt,
  },
  (table) => [
    uniqueIndex("project_estimations_consultation_id_uidx").on(
      table.consultationId,
    ),
    index("project_estimations_organization_id_idx").on(table.organizationId),
    index("project_estimations_requirement_summary_id_idx").on(
      table.requirementSummaryId,
    ),
  ],
);
