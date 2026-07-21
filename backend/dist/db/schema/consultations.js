"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
const users_js_1 = require("./users.js");
exports.consultations = (0, pg_core_1.pgTable)("consultations", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    createdBy: (0, pg_core_1.uuid)("created_by")
        .notNull()
        .references(() => users_js_1.users.id, { onDelete: "restrict" }),
    assignedTo: (0, pg_core_1.uuid)("assigned_to").references(() => users_js_1.users.id, {
        onDelete: "set null",
    }),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    status: (0, pg_core_1.varchar)("status", { length: 64 }).notNull().default("draft"),
    industry: (0, pg_core_1.varchar)("industry", { length: 128 }),
    projectType: (0, pg_core_1.varchar)("project_type", { length: 128 }),
    budgetRange: (0, pg_core_1.varchar)("budget_range", { length: 128 }),
    timeline: (0, pg_core_1.varchar)("timeline", { length: 128 }),
    startedAt: (0, pg_core_1.timestamp)("started_at", { withTimezone: true }),
    completedAt: (0, pg_core_1.timestamp)("completed_at", { withTimezone: true }),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.index)("consultations_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("consultations_created_by_idx").on(table.createdBy),
    (0, pg_core_1.index)("consultations_assigned_to_idx").on(table.assignedTo),
]);
