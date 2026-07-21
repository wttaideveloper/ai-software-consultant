"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.permissions = (0, pg_core_1.pgTable)("permissions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    code: (0, pg_core_1.varchar)("code", { length: 128 }).notNull(),
    module: (0, pg_core_1.varchar)("module", { length: 128 }).notNull(),
    description: (0, pg_core_1.text)("description"),
}, (table) => [(0, pg_core_1.uniqueIndex)("permissions_code_uidx").on(table.code)]);
