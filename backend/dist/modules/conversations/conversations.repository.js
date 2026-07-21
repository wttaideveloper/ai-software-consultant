"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsRepository = exports.ConversationsRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class ConversationsRepository {
    async findConsultationByIdAndOrganization(consultationId, organizationId, executor = index_js_1.db) {
        const [consultation] = await executor
            .select({
            id: index_js_2.consultations.id,
            organizationId: index_js_2.consultations.organizationId,
        })
            .from(index_js_2.consultations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.consultations.id, consultationId), (0, drizzle_orm_1.eq)(index_js_2.consultations.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.consultations.deletedAt)))
            .limit(1);
        return consultation ?? null;
    }
    async findMessagesByConsultation(consultationId, organizationId, executor = index_js_1.db) {
        return executor
            .select()
            .from(index_js_2.conversationMessages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.conversationMessages.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.conversationMessages.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.conversationMessages.deletedAt)))
            .orderBy((0, drizzle_orm_1.asc)(index_js_2.conversationMessages.createdAt), (0, drizzle_orm_1.asc)(index_js_2.conversationMessages.id));
    }
    async findByIdAndOrganization(messageId, organizationId, executor = index_js_1.db) {
        const [message] = await executor
            .select()
            .from(index_js_2.conversationMessages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.conversationMessages.id, messageId), (0, drizzle_orm_1.eq)(index_js_2.conversationMessages.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.conversationMessages.deletedAt)))
            .limit(1);
        return message ?? null;
    }
    async create(data, executor = index_js_1.db) {
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
    async update(messageId, organizationId, data, executor = index_js_1.db) {
        const [message] = await executor
            .update(index_js_2.conversationMessages)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.conversationMessages.id, messageId), (0, drizzle_orm_1.eq)(index_js_2.conversationMessages.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.conversationMessages.deletedAt)))
            .returning();
        if (!message) {
            throw new Error("Failed to update conversation message");
        }
        return message;
    }
    async softDelete(messageId, organizationId, executor = index_js_1.db) {
        const [message] = await executor
            .update(index_js_2.conversationMessages)
            .set({ deletedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.conversationMessages.id, messageId), (0, drizzle_orm_1.eq)(index_js_2.conversationMessages.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.conversationMessages.deletedAt)))
            .returning();
        if (!message) {
            throw new Error("Failed to delete conversation message");
        }
        return message;
    }
}
exports.ConversationsRepository = ConversationsRepository;
exports.conversationsRepository = new ConversationsRepository();
