"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectEstimations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const consultations_js_1 = require("./consultations.js");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
const requirement_summaries_js_1 = require("./requirement-summaries.js");
exports.projectEstimations = (0, pg_core_1.pgTable)("project_estimations", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    consultationId: (0, pg_core_1.uuid)("consultation_id")
        .notNull()
        .references(() => consultations_js_1.consultations.id, { onDelete: "cascade" }),
    requirementSummaryId: (0, pg_core_1.uuid)("requirement_summary_id")
        .notNull()
        .references(() => requirement_summaries_js_1.requirementSummaries.id, { onDelete: "cascade" }),
    estimatedHours: (0, pg_core_1.integer)("estimated_hours").notNull(),
    estimatedWeeks: (0, pg_core_1.integer)("estimated_weeks").notNull(),
    estimatedTeamSize: (0, pg_core_1.integer)("estimated_team_size").notNull(),
    complexity: (0, enums_js_1.featureComplexityEnum)("complexity").notNull(),
    confidenceScore: (0, pg_core_1.numeric)("confidence_score", {
        precision: 5,
        scale: 4,
    }).notNull(),
    assumptions: (0, pg_core_1.text)("assumptions").notNull(),
    risks: (0, pg_core_1.jsonb)("risks").$type().notNull(),
    breakdown: (0, pg_core_1.jsonb)("breakdown").$type().notNull(),
    generatedBy: (0, enums_js_1.requirementSummaryGeneratedByEnum)("generated_by")
        .notNull()
        .default("AI"),
    version: (0, pg_core_1.integer)("version").notNull().default(1),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.uniqueIndex)("project_estimations_consultation_id_uidx").on(table.consultationId),
    (0, pg_core_1.index)("project_estimations_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("project_estimations_requirement_summary_id_idx").on(table.requirementSummaryId),
]);
