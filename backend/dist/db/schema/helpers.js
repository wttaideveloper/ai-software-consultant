"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletedAt = exports.updatedAt = exports.createdAt = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.createdAt = (0, pg_core_1.timestamp)("created_at", { withTimezone: true })
    .defaultNow()
    .notNull();
exports.updatedAt = (0, pg_core_1.timestamp)("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());
exports.deletedAt = (0, pg_core_1.timestamp)("deleted_at", { withTimezone: true });
