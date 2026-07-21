"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const env_js_1 = require("../../config/env.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai/ai.constants.js");
const ai_orchestrator_js_1 = require("../ai/ai.orchestrator.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const chat_repository_js_1 = require("./chat.repository.js");
const PROMPT_VERSION = "1.0.0";
function toChatMessageDto(message) {
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
function toConversationHistory(messages) {
    return messages.map((message) => ({
        role: message.senderType,
        content: message.message,
    }));
}
function resolveSafeErrorMessage(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error.message;
    }
    return "AI generation failed";
}
class ChatService {
    async chat(organizationId, consultationId, userId, message) {
        const consultation = await chat_repository_js_1.chatRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const organization = await chat_repository_js_1.chatRepository.findOrganizationById(organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const userMessage = await chat_repository_js_1.chatRepository.createMessage({
            consultationId,
            organizationId,
            senderType: "user",
            message,
            metadata: null,
            createdBy: userId,
        });
        const historyRecords = await chat_repository_js_1.chatRepository.findMessagesByConsultation(consultationId, organizationId);
        const conversationHistory = toConversationHistory(historyRecords);
        let aiResponse;
        try {
            aiResponse = await ai_orchestrator_js_1.aiOrchestrator.generateConversationReply({
                organization: {
                    id: organization.id,
                    name: organization.name,
                },
                consultation: {
                    id: consultation.id,
                    title: consultation.title,
                    industry: consultation.industry,
                    projectType: consultation.projectType,
                    budgetRange: consultation.budgetRange,
                    timeline: consultation.timeline,
                    status: consultation.status,
                },
                conversationHistory,
                userMessage: message,
            });
        }
        catch (error) {
            await chat_repository_js_1.chatRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: userMessage.id,
                provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
                model: env_js_1.config.OPENAI_DEFAULT_MODEL,
                promptType: prompt_constants_js_1.PROMPT_TYPES.CONSULTATION,
                promptVersion: PROMPT_VERSION,
                requestTokens: 0,
                responseTokens: 0,
                totalTokens: 0,
                latencyMs: 0,
                estimatedCost: "0",
                status: "failed",
                errorMessage: resolveSafeErrorMessage(error),
            });
            logger_js_1.logger.error(`Chat AI generation failed for consultation=${consultationId}`);
            if (error instanceof app_error_js_1.AppError) {
                throw error;
            }
            throw new app_error_js_1.AppError("Failed to generate AI response", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        const { assistantMessage } = await chat_repository_js_1.chatRepository.runInTransaction(async (tx) => {
            const savedAssistantMessage = await chat_repository_js_1.chatRepository.createMessage({
                consultationId,
                organizationId,
                senderType: "assistant",
                message: aiResponse.message.content,
                metadata: {
                    finishReason: aiResponse.metadata.finishReason ?? null,
                    requestId: aiResponse.metadata.requestId ?? null,
                },
                createdBy: null,
            }, tx);
            await chat_repository_js_1.chatRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: savedAssistantMessage.id,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.CONSULTATION,
                promptVersion: PROMPT_VERSION,
                requestTokens: aiResponse.usage.promptTokens,
                responseTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
                latencyMs: aiResponse.metadata.latencyMs ?? 0,
                estimatedCost: "0",
                status: "success",
                errorMessage: null,
            }, tx);
            return { assistantMessage: savedAssistantMessage };
        });
        logger_js_1.logger.info(`Chat reply generated for consultation=${consultationId} model=${aiResponse.metadata.model}`);
        return {
            userMessage: toChatMessageDto(userMessage),
            assistantMessage: toChatMessageDto(assistantMessage),
            usage: {
                promptTokens: aiResponse.usage.promptTokens,
                completionTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
            },
            model: aiResponse.metadata.model,
        };
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
