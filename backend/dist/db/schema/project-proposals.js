"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectProposals = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const consultations_js_1 = require("./consultations.js");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
const project_estimations_js_1 = require("./project-estimations.js");
const requirement_summaries_js_1 = require("./requirement-summaries.js");
exports.projectProposals = (0, pg_core_1.pgTable)("project_proposals", {
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
    estimationId: (0, pg_core_1.uuid)("estimation_id")
        .notNull()
        .references(() => project_estimations_js_1.projectEstimations.id, { onDelete: "cascade" }),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    executiveSummary: (0, pg_core_1.text)("executive_summary").notNull(),
    scopeOfWork: (0, pg_core_1.jsonb)("scope_of_work").$type().notNull(),
    deliverables: (0, pg_core_1.jsonb)("deliverables").$type().notNull(),
    timeline: (0, pg_core_1.varchar)("timeline", { length: 255 }).notNull(),
    assumptions: (0, pg_core_1.text)("assumptions").notNull(),
    exclusions: (0, pg_core_1.text)("exclusions").notNull(),
    pricingNotes: (0, pg_core_1.text)("pricing_notes").notNull(),
    proposalMarkdown: (0, pg_core_1.text)("proposal_markdown").notNull(),
    generatedBy: (0, enums_js_1.requirementSummaryGeneratedByEnum)("generated_by")
        .notNull()
        .default("AI"),
    version: (0, pg_core_1.integer)("version").notNull().default(1),
    status: (0, enums_js_1.proposalStatusEnum)("status").notNull().default("DRAFT"),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.uniqueIndex)("project_proposals_consultation_id_uidx").on(table.consultationId),
    (0, pg_core_1.index)("project_proposals_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("project_proposals_requirement_summary_id_idx").on(table.requirementSummaryId),
    (0, pg_core_1.index)("project_proposals_estimation_id_idx").on(table.estimationId),
]);
