"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const roles_js_1 = require("./roles.js");
const users_js_1 = require("./users.js");
exports.userRoles = (0, pg_core_1.pgTable)("user_roles", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => users_js_1.users.id, { onDelete: "cascade" }),
    roleId: (0, pg_core_1.uuid)("role_id")
        .notNull()
        .references(() => roles_js_1.roles.id, { onDelete: "cascade" }),
    assignedAt: (0, pg_core_1.timestamp)("assigned_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    assignedBy: (0, pg_core_1.uuid)("assigned_by").references(() => users_js_1.users.id, {
        onDelete: "set null",
    }),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("user_roles_user_role_uidx").on(table.userId, table.roleId),
    (0, pg_core_1.index)("user_roles_user_id_idx").on(table.userId),
    (0, pg_core_1.index)("user_roles_role_id_idx").on(table.roleId),
]);
