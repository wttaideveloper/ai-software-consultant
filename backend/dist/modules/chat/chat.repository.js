"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = exports.ChatRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class ChatRepository {
    async runInTransaction(callback) {
        return index_js_1.db.transaction(async (tx) => callback(tx));
    }
    async findConsultationByIdAndOrganization(consultationId, organizationId, executor = index_js_1.db) {
        const [consultation] = await executor
            .select()
            .from(index_js_2.consultations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.consultations.id, consultationId), (0, drizzle_orm_1.eq)(index_js_2.consultations.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.consultations.deletedAt)))
            .limit(1);
        return consultation ?? null;
    }
    async findOrganizationById(organizationId, executor = index_js_1.db) {
        const [organization] = await executor
            .select()
            .from(index_js_2.organizations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.organizations.id, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.organizations.deletedAt)))
            .limit(1);
        return organization ?? null;
    }
    async createMessage(data, executor = index_js_1.db) {
        const [message] = await executor
            .insert(index_js_2.conversationMessages)
            .values({
            consultationId: data.consultationId,
            organizationId: data.organizationId,
            senderType: data.senderType,
            message: data.message,
            metadata: data.metadata,
            createdBy: data.createdBy,
        })
            .returning();
        if (!message) {
            throw new Error("Failed to create conversation message");
        }
        return message;
    }
    async findMessagesByConsultation(consultationId, organizationId, executor = index_js_1.db) {
        return executor
            .select()
            .from(index_js_2.conversationMessages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.conversationMessages.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.conversationMessages.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.conversationMessages.deletedAt)))
            .orderBy((0, drizzle_orm_1.asc)(index_js_2.conversationMessages.createdAt), (0, drizzle_orm_1.asc)(index_js_2.conversationMessages.id));
    }
    async createAiGeneration(data, executor = index_js_1.db) {
        const [generation] = await executor
            .insert(index_js_2.aiGenerations)
            .values({
            organizationId: data.organizationId,
            consultationId: data.consultationId,
            conversationMessageId: data.conversationMessageId,
            provider: data.provider,
            model: data.model,
            promptType: data.promptType,
            promptVersion: data.promptVersion,
            requestTokens: data.requestTokens,
            responseTokens: data.responseTokens,
            totalTokens: data.totalTokens,
            latencyMs: data.latencyMs,
            estimatedCost: data.estimatedCost,
            status: data.status,
            errorMessage: data.errorMessage,
        })
            .returning();
        if (!generation) {
            throw new Error("Failed to create AI generation record");
        }
        return generation;
    }
}
exports.ChatRepository = ChatRepository;
exports.chatRepository = new ChatRepository();
