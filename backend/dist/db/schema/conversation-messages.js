"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationMessages = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const consultations_js_1 = require("./consultations.js");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
const users_js_1 = require("./users.js");
exports.conversationMessages = (0, pg_core_1.pgTable)("conversation_messages", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    consultationId: (0, pg_core_1.uuid)("consultation_id")
        .notNull()
        .references(() => consultations_js_1.consultations.id, { onDelete: "cascade" }),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    senderType: (0, enums_js_1.messageSenderTypeEnum)("sender_type").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    metadata: (0, pg_core_1.jsonb)("metadata").$type(),
    createdBy: (0, pg_core_1.uuid)("created_by").references(() => users_js_1.users.id, {
        onDelete: "set null",
    }),
    createdAt: helpers_js_1.createdAt,
    deletedAt: helpers_js_1.deletedAt,
}, (table) => [
    (0, pg_core_1.index)("conversation_messages_consultation_id_idx").on(table.consultationId),
    (0, pg_core_1.index)("conversation_messages_organization_id_idx").on(table.organizationId),
]);
