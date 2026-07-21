"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiGenerations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const consultations_js_1 = require("./consultations.js");
const conversation_messages_js_1 = require("./conversation-messages.js");
const enums_js_1 = require("./enums.js");
const helpers_js_1 = require("./helpers.js");
const organizations_js_1 = require("./organizations.js");
exports.aiGenerations = (0, pg_core_1.pgTable)("ai_generations", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    organizationId: (0, pg_core_1.uuid)("organization_id")
        .notNull()
        .references(() => organizations_js_1.organizations.id, { onDelete: "cascade" }),
    consultationId: (0, pg_core_1.uuid)("consultation_id")
        .notNull()
        .references(() => consultations_js_1.consultations.id, { onDelete: "cascade" }),
    conversationMessageId: (0, pg_core_1.uuid)("conversation_message_id").references(() => conversation_messages_js_1.conversationMessages.id, { onDelete: "set null" }),
    provider: (0, pg_core_1.varchar)("provider", { length: 64 }).notNull(),
    model: (0, pg_core_1.varchar)("model", { length: 128 }).notNull(),
    promptType: (0, pg_core_1.varchar)("prompt_type", { length: 64 }).notNull(),
    promptVersion: (0, pg_core_1.varchar)("prompt_version", { length: 64 }).notNull(),
    requestTokens: (0, pg_core_1.integer)("request_tokens").notNull().default(0),
    responseTokens: (0, pg_core_1.integer)("response_tokens").notNull().default(0),
    totalTokens: (0, pg_core_1.integer)("total_tokens").notNull().default(0),
    latencyMs: (0, pg_core_1.integer)("latency_ms").notNull().default(0),
    estimatedCost: (0, pg_core_1.numeric)("estimated_cost", {
        precision: 12,
        scale: 6,
    })
        .notNull()
        .default("0"),
    status: (0, enums_js_1.aiGenerationStatusEnum)("status").notNull(),
    errorMessage: (0, pg_core_1.text)("error_message"),
    createdAt: helpers_js_1.createdAt,
}, (table) => [
    (0, pg_core_1.index)("ai_generations_organization_id_idx").on(table.organizationId),
    (0, pg_core_1.index)("ai_generations_consultation_id_idx").on(table.consultationId),
    (0, pg_core_1.index)("ai_generations_created_at_idx").on(table.createdAt),
    (0, pg_core_1.index)("ai_generations_status_idx").on(table.status),
]);
