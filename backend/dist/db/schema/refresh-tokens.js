"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokens = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const users_js_1 = require("./users.js");
exports.refreshTokens = (0, pg_core_1.pgTable)("refresh_tokens", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => users_js_1.users.id, { onDelete: "cascade" }),
    tokenHash: (0, pg_core_1.text)("token_hash").notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { withTimezone: true }).notNull(),
    revokedAt: (0, pg_core_1.timestamp)("revoked_at", { withTimezone: true }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 64 }),
    createdAt: helpers_js_1.createdAt,
}, (table) => [(0, pg_core_1.index)("refresh_tokens_user_id_idx").on(table.userId)]);
