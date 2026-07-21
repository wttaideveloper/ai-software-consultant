"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationTokens = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const users_js_1 = require("./users.js");
exports.verificationTokens = (0, pg_core_1.pgTable)("verification_tokens", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => users_js_1.users.id, { onDelete: "cascade" }),
    type: (0, enums_js_1.verificationTokenTypeEnum)("type").notNull(),
    tokenHash: (0, pg_core_1.text)("token_hash").notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at", { withTimezone: true }).notNull(),
    usedAt: (0, pg_core_1.timestamp)("used_at", { withTimezone: true }),
    createdAt: helpers_js_1.createdAt,
}, (table) => [(0, pg_core_1.index)("verification_tokens_user_id_idx").on(table.userId)]);
