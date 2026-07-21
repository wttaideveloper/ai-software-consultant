"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsService = exports.ConversationsService = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const conversations_repository_js_1 = require("./conversations.repository.js");
function toMessageDto(message) {
    return {
        id: message.id,
        consultationId: message.consultationId,
        organizationId: message.organizationId,
        senderType: message.senderType,
        message: message.message,
        metadata: message.metadata ?? null,
        createdBy: message.createdBy,
        createdAt: message.createdAt,
    };
}
class ConversationsService {
    async assertConsultationAccess(consultationId, organizationId) {
        const consultation = await conversations_repository_js_1.conversationsRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
    }
    async listByConsultation(organizationId, consultationId) {
        await this.assertConsultationAccess(consultationId, organizationId);
        const messages = await conversations_repository_js_1.conversationsRepository.findMessagesByConsultation(consultationId, organizationId);
        return messages.map(toMessageDto);
    }
    async createUserMessage(organizationId, consultationId, createdBy, input) {
        await this.assertConsultationAccess(consultationId, organizationId);
        const message = await conversations_repository_js_1.conversationsRepository.create({
            consultationId,
            organizationId,
            senderType: "user",
            message: input.message,
            metadata: input.metadata ?? null,
            createdBy,
        });
        logger_js_1.logger.info(`Conversation message created: ${message.id} for consultation ${consultationId}`);
        return toMessageDto(message);
    }
    async updateUserMessage(organizationId, messageId, input) {
        const existing = await conversations_repository_js_1.conversationsRepository.findByIdAndOrganization(messageId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Message not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        if (existing.senderType !== "user") {
            throw new app_error_js_1.AppError("Only user messages can be edited", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const message = await conversations_repository_js_1.conversationsRepository.update(messageId, organizationId, {
            message: input.message,
            metadata: input.metadata,
        });
        logger_js_1.logger.info(`Conversation message updated: ${message.id}`);
        return toMessageDto(message);
    }
    async remove(organizationId, messageId) {
        const existing = await conversations_repository_js_1.conversationsRepository.findByIdAndOrganization(messageId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Message not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        await conversations_repository_js_1.conversationsRepository.softDelete(messageId, organizationId);
        logger_js_1.logger.info(`Conversation message soft-deleted: ${messageId}`);
    }
}
exports.ConversationsService = ConversationsService;
exports.conversationsService = new ConversationsService();
