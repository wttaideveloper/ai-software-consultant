"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogs = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
const users_js_1 = require("./users.js");
exports.auditLogs = (0, pg_core_1.pgTable)("audit_logs", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    actorId: (0, pg_core_1.uuid)("actor_id").references(() => users_js_1.users.id, {
        onDelete: "set null",
    }),
    action: (0, pg_core_1.varchar)("action", { length: 128 }).notNull(),
    entityType: (0, pg_core_1.varchar)("entity_type", { length: 128 }).notNull(),
    entityId: (0, pg_core_1.uuid)("entity_id"),
    before: (0, pg_core_1.jsonb)("before").$type(),
    after: (0, pg_core_1.jsonb)("after").$type(),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 64 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    createdAt: helpers_js_1.createdAt,
}, (table) => [
    (0, pg_core_1.index)("audit_logs_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("audit_logs_actor_id_idx").on(table.actorId),
]);
