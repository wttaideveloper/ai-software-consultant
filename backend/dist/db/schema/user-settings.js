"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSettings = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const helpers_js_1 = require("./helpers.js");
const users_js_1 = require("./users.js");
exports.userSettings = (0, pg_core_1.pgTable)("user_settings", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)("user_id")
        .notNull()
        .references(() => users_js_1.users.id, { onDelete: "cascade" }),
    key: (0, pg_core_1.varchar)("key", { length: 128 }).notNull(),
    value: (0, pg_core_1.jsonb)("value").$type().notNull(),
    updatedAt: helpers_js_1.updatedAt,
}, (table) => [
    (0, pg_core_1.uniqueIndex)("user_settings_user_key_uidx").on(table.userId, table.key),
    (0, pg_core_1.index)("user_settings_user_id_idx").on(table.userId),
]);
