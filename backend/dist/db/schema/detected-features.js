"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectedFeatures = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const consultations_js_1 = require("./consultations.js");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
const requirement_summaries_js_1 = require("./requirement-summaries.js");
exports.detectedFeatures = (0, pg_core_1.pgTable)("detected_features", {
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
    featureName: (0, pg_core_1.varchar)("feature_name", { length: 255 }).notNull(),
    featureCategory: (0, pg_core_1.varchar)("feature_category", { length: 128 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    priority: (0, enums_js_1.featurePriorityEnum)("priority").notNull(),
    complexity: (0, enums_js_1.featureComplexityEnum)("complexity").notNull(),
    confidenceScore: (0, pg_core_1.numeric)("confidence_score", {
        precision: 5,
        scale: 4,
    }).notNull(),
    aiReasoning: (0, pg_core_1.text)("ai_reasoning").notNull(),
    manuallyVerified: (0, pg_core_1.boolean)("manually_verified").notNull().default(false),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.index)("detected_features_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("detected_features_consultation_id_idx").on(table.consultationId),
    (0, pg_core_1.index)("detected_features_requirement_summary_id_idx").on(table.requirementSummaryId),
]);
