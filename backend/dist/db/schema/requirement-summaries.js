"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementSummaries = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const consultations_js_1 = require("./consultations.js");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
exports.requirementSummaries = (0, pg_core_1.pgTable)("requirement_summaries", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    consultationId: (0, pg_core_1.uuid)("consultation_id")
        .notNull()
        .references(() => consultations_js_1.consultations.id, { onDelete: "cascade" }),
    summaryMarkdown: (0, pg_core_1.text)("summary_markdown").notNull(),
    structuredSummary: (0, pg_core_1.jsonb)("structured_summary")
        .$type()
        .notNull(),
    version: (0, pg_core_1.integer)("version").notNull().default(1),
    status: (0, enums_js_1.requirementSummaryStatusEnum)("status").notNull().default("draft"),
    generatedBy: (0, enums_js_1.requirementSummaryGeneratedByEnum)("generated_by")
        .notNull()
        .default("AI"),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.uniqueIndex)("requirement_summaries_consultation_id_uidx").on(table.consultationId),
    (0, pg_core_1.index)("requirement_summaries_organization_id_idx").on(table.organizationId),
]);
