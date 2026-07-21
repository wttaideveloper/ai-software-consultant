"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationSettings = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
exports.organizationSettings = (0, pg_core_1.pgTable)("organization_settings", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    key: (0, pg_core_1.varchar)("key", { length: 128 }).notNull(),
    value: (0, pg_core_1.jsonb)("value").$type().notNull(),
    updatedAt: helpers_js_1.updatedAt,
}, (table) => [
    (0, pg_core_1.uniqueIndex)("organization_settings_org_key_uidx").on(table.organizationId, table.key),
    (0, pg_core_1.index)("organization_settings_organization_id_idx").on(table.organizationId),
]);
