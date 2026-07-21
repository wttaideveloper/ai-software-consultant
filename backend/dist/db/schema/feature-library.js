"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureLibrary = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
exports.featureLibrary = (0, pg_core_1.pgTable)("feature_library", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    category: (0, pg_core_1.varchar)("category", { length: 128 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    defaultComplexity: (0, enums_js_1.featureComplexityEnum)("default_complexity").notNull(),
    defaultEstimatedHours: (0, pg_core_1.integer)("default_estimated_hours").notNull(),
    tags: (0, pg_core_1.jsonb)("tags").$type().notNull().default([]),
    technologies: (0, pg_core_1.jsonb)("technologies").$type().notNull().default([]),
    notes: (0, pg_core_1.text)("notes"),
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.index)("feature_library_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("feature_library_category_idx").on(table.category),
    (0, pg_core_1.index)("feature_library_name_idx").on(table.name),
]);
