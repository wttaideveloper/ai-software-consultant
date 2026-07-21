"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
exports.roles = (0, pg_core_1.pgTable)("roles", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id").references(() => organizations_js_1.organizations.id, {
        onDelete: "cascade",
    }),
    name: (0, pg_core_1.varchar)("name", { length: 128 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 128 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    isSystem: (0, pg_core_1.boolean)("is_system").notNull().default(false),
    createdAt: helpers_js_1.createdAt,
}, (table) => [
    (0, pg_core_1.index)("roles_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("roles_slug_idx").on(table.slug),
]);
