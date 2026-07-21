"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementSummaryService = exports.RequirementSummaryService = void 0;
const env_js_1 = require("../../config/env.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai/ai.constants.js");
const ai_orchestrator_js_1 = require("../ai/ai.orchestrator.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const requirement_summary_repository_js_1 = require("./requirement-summary.repository.js");
const requirement_summary_validation_js_1 = require("./requirement-summary.validation.js");
const PROMPT_VERSION = "1.0.0";
function toResponseDto(consultation, summary) {
    return {
        consultation: {
            id: consultation.id,
            title: consultation.title,
            status: consultation.status,
            industry: consultation.industry,
            projectType: consultation.projectType,
            budgetRange: consultation.budgetRange,
            timeline: consultation.timeline,
        },
        summary: summary.summaryMarkdown,
        structuredSummary: summary.structuredSummary,
        version: summary.version,
        status: summary.status,
        generatedBy: summary.generatedBy,
        updatedAt: summary.updatedAt,
    };
}
function toConversationHistory(messages) {
    return messages.map((message) => ({
        role: message.senderType,
        content: message.message,
    }));
}
function buildConversationTranscript(messages) {
    if (messages.length === 0) {
        return "No conversation messages are available yet.";
    }
    return messages
        .map((message) => `${message.senderType.toUpperCase()}: ${message.message}`)
        .join("\n\n");
}
function extractJsonPayload(content) {
    const trimmed = content.trim();
    try {
        return JSON.parse(trimmed);
    }
    catch {
        const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fencedMatch?.[1]) {
            return JSON.parse(fencedMatch[1].trim());
        }
        const firstBrace = trimmed.indexOf("{");
        const lastBrace = trimmed.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        }
        throw new Error("Invalid JSON payload");
    }
}
function parseAiRequirementSummary(content) {
    let parsed;
    try {
        parsed = extractJsonPayload(content);
    }
    catch {
        throw new app_error_js_1.AppError("AI returned an invalid requirement summary format", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    const validated = requirement_summary_validation_js_1.aiRequirementSummaryPayloadSchema.safeParse(parsed);
    if (!validated.success) {
        throw new app_error_js_1.AppError("AI returned an incomplete requirement summary", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return validated.data;
}
function resolveSafeErrorMessage(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error.message;
    }
    return "AI generation failed";
}
class RequirementSummaryService {
    async get(organizationId, consultationId) {
        const consultation = await requirement_summary_repository_js_1.requirementSummaryRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const summary = await requirement_summary_repository_js_1.requirementSummaryRepository.findByConsultationId(consultationId, organizationId);
        if (!summary) {
            throw new app_error_js_1.AppError("Requirement summary not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        return toResponseDto(consultation, summary);
    }
    async generate(organizationId, consultationId) {
        const consultation = await requirement_summary_repository_js_1.requirementSummaryRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const organization = await requirement_summary_repository_js_1.requirementSummaryRepository.findOrganizationById(organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const messages = await requirement_summary_repository_js_1.requirementSummaryRepository.findMessagesByConsultation(consultationId, organizationId);
        if (messages.length === 0) {
            throw new app_error_js_1.AppError("Conversation history is required before generating a requirement summary", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const existing = await requirement_summary_repository_js_1.requirementSummaryRepository.findByConsultationId(consultationId, organizationId);
        let aiResponse;
        try {
            aiResponse = await ai_orchestrator_js_1.aiOrchestrator.generateConversationReply({
                promptType: prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_SUMMARY,
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
                conversationHistory: toConversationHistory(messages),
                userMessage: buildConversationTranscript(messages),
            });
        }
        catch (error) {
            await requirement_summary_repository_js_1.requirementSummaryRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
                model: env_js_1.config.OPENAI_DEFAULT_MODEL,
                promptType: prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_SUMMARY,
                promptVersion: PROMPT_VERSION,
                requestTokens: 0,
                responseTokens: 0,
                totalTokens: 0,
                latencyMs: 0,
                estimatedCost: "0",
                status: "failed",
                errorMessage: resolveSafeErrorMessage(error),
            });
            if (error instanceof app_error_js_1.AppError) {
                throw error;
            }
            throw new app_error_js_1.AppError("Failed to generate requirement summary", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        let parsedSummary;
        try {
            parsedSummary = parseAiRequirementSummary(aiResponse.message.content);
        }
        catch (error) {
            await requirement_summary_repository_js_1.requirementSummaryRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_SUMMARY,
                promptVersion: PROMPT_VERSION,
                requestTokens: aiResponse.usage.promptTokens,
                responseTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
                latencyMs: aiResponse.metadata.latencyMs ?? 0,
                estimatedCost: "0",
                status: "failed",
                errorMessage: resolveSafeErrorMessage(error),
            });
            throw error instanceof app_error_js_1.AppError
                ? error
                : new app_error_js_1.AppError("Failed to parse requirement summary", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        const savedSummary = await requirement_summary_repository_js_1.requirementSummaryRepository.runInTransaction(async (tx) => {
            let summary;
            if (existing) {
                summary = await requirement_summary_repository_js_1.requirementSummaryRepository.update(existing.id, organizationId, {
                    summaryMarkdown: parsedSummary.summaryMarkdown,
                    structuredSummary: parsedSummary.structuredSummary,
                    version: existing.version + 1,
                    status: "draft",
                    generatedBy: "AI",
                }, tx);
            }
            else {
                summary = await requirement_summary_repository_js_1.requirementSummaryRepository.create({
                    organizationId,
                    consultationId,
                    summaryMarkdown: parsedSummary.summaryMarkdown,
                    structuredSummary: parsedSummary.structuredSummary,
                    version: 1,
                    status: "draft",
                    generatedBy: "AI",
                }, tx);
            }
            await requirement_summary_repository_js_1.requirementSummaryRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.REQUIREMENT_SUMMARY,
                promptVersion: PROMPT_VERSION,
                requestTokens: aiResponse.usage.promptTokens,
                responseTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
                latencyMs: aiResponse.metadata.latencyMs ?? 0,
                estimatedCost: "0",
                status: "success",
                errorMessage: null,
            }, tx);
            return summary;
        });
        logger_js_1.logger.info(`Requirement summary generated for consultation=${consultationId} version=${savedSummary.version}`);
        return toResponseDto(consultation, savedSummary);
    }
    async update(organizationId, consultationId, input) {
        const consultation = await requirement_summary_repository_js_1.requirementSummaryRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const existing = await requirement_summary_repository_js_1.requirementSummaryRepository.findByConsultationId(consultationId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Requirement summary not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const updated = await requirement_summary_repository_js_1.requirementSummaryRepository.update(existing.id, organizationId, {
            summaryMarkdown: input.summaryMarkdown,
            structuredSummary: input.structuredSummary,
            status: input.status,
            generatedBy: "USER",
            version: existing.version + 1,
        });
        logger_js_1.logger.info(`Requirement summary updated for consultation=${consultationId} version=${updated.version}`);
        return toResponseDto(consultation, updated);
    }
}
exports.RequirementSummaryService = RequirementSummaryService;
exports.requirementSummaryService = new RequirementSummaryService();
