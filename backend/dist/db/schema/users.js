"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    fullName: (0, pg_core_1.varchar)("full_name", { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    avatarUrl: (0, pg_core_1.text)("avatar_url"),
    phone: (0, pg_core_1.varchar)("phone", { length: 64 }),
    status: (0, pg_core_1.varchar)("status", { length: 64 }).notNull().default("active"),
    emailVerifiedAt: (0, pg_core_1.timestamp)("email_verified_at", { withTimezone: true }),
    lastLoginAt: (0, pg_core_1.timestamp)("last_login_at", { withTimezone: true }),
    createdAt: helpers_js_1.createdAt,
    updatedAt: helpers_js_1.updatedAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.uniqueIndex)("users_email_uidx").on(table.email),
    (0, pg_core_1.index)("users_organization_id_idx").on(table.organizationId),
]);
