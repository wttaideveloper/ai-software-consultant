"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
exports.organizations = (0, pg_core_1.pgTable)("organizations", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 255 }).notNull(),
    plan: (0, pg_core_1.varchar)("plan", { length: 64 }).notNull().default("free"),
    status: (0, pg_core_1.varchar)("status", { length: 64 }).notNull().default("active"),
    billingEmail: (0, pg_core_1.varchar)("billing_email", { length: 255 }),
    timezone: (0, pg_core_1.varchar)("timezone", { length: 64 }).notNull().default("UTC"),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [(0, pg_core_1.uniqueIndex)("organizations_slug_uidx").on(table.slug)]);
