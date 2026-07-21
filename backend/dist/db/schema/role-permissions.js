"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const permissions_js_1 = require("./permissions.js");
const roles_js_1 = require("./roles.js");
exports.rolePermissions = (0, pg_core_1.pgTable)("role_permissions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    roleId: (0, pg_core_1.uuid)("role_id")
        .notNull()
        .references(() => roles_js_1.roles.id, { onDelete: "cascade" }),
    permissionId: (0, pg_core_1.uuid)("permission_id")
        .notNull()
        .references(() => permissions_js_1.permissions.id, { onDelete: "cascade" }),
    createdAt: helpers_js_1.createdAt,
}, (table) => [
    (0, pg_core_1.uniqueIndex)("role_permissions_role_permission_uidx").on(table.roleId, table.permissionId),
    (0, pg_core_1.index)("role_permissions_role_id_idx").on(table.roleId),
    (0, pg_core_1.index)("role_permissions_permission_id_idx").on(table.permissionId),
]);
