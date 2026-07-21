"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimationService = exports.EstimationService = void 0;
const env_js_1 = require("../../config/env.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai/ai.constants.js");
const ai_orchestrator_js_1 = require("../ai/ai.orchestrator.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const estimation_repository_js_1 = require("./estimation.repository.js");
const estimation_validation_js_1 = require("./estimation.validation.js");
const PROMPT_VERSION = "1.0.0";
function toEstimationDto(estimation) {
    return {
        id: estimation.id,
        organizationId: estimation.organizationId,
        consultationId: estimation.consultationId,
        requirementSummaryId: estimation.requirementSummaryId,
        estimatedHours: estimation.estimatedHours,
        estimatedWeeks: estimation.estimatedWeeks,
        estimatedTeamSize: estimation.estimatedTeamSize,
        complexity: estimation.complexity,
        confidenceScore: Number(estimation.confidenceScore),
        assumptions: estimation.assumptions,
        risks: estimation.risks,
        breakdown: estimation.breakdown,
        generatedBy: estimation.generatedBy,
        version: estimation.version,
        createdAt: estimation.createdAt,
        updatedAt: estimation.updatedAt,
    };
}
function formatAssumptions(assumptions) {
    return assumptions.map((item) => item.trim()).join("\n");
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
function parseEstimationPayload(content) {
    let parsed;
    try {
        parsed = extractJsonPayload(content);
    }
    catch {
        throw new app_error_js_1.AppError("AI returned an invalid estimation format", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    const validated = estimation_validation_js_1.aiEstimationPayloadSchema.safeParse(parsed);
    if (!validated.success) {
        throw new app_error_js_1.AppError("AI returned incomplete estimation data", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return validated.data;
}
function resolveSafeErrorMessage(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error.message;
    }
    return "AI generation failed";
}
function buildEstimationPrompt(summary, features) {
    const featurePayload = features.map((feature) => ({
        name: feature.featureName,
        category: feature.featureCategory,
        description: feature.description,
        priority: feature.priority,
        complexity: feature.complexity,
        confidence: Number(feature.confidenceScore),
    }));
    return [
        "REQUIREMENT SUMMARY MARKDOWN:",
        summary.summaryMarkdown,
        "",
        "STRUCTURED SUMMARY JSON:",
        JSON.stringify(summary.structuredSummary, null, 2),
        "",
        "DETECTED FEATURES JSON:",
        JSON.stringify(featurePayload, null, 2),
    ].join("\n");
}
class EstimationService {
    async get(organizationId, consultationId) {
        const consultation = await estimation_repository_js_1.estimationRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const estimation = await estimation_repository_js_1.estimationRepository.findByConsultationId(consultationId, organizationId);
        if (!estimation) {
            throw new app_error_js_1.AppError("Estimation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        return toEstimationDto(estimation);
    }
    async generate(organizationId, consultationId) {
        const consultation = await estimation_repository_js_1.estimationRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const organization = await estimation_repository_js_1.estimationRepository.findOrganizationById(organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const requirementSummary = await estimation_repository_js_1.estimationRepository.findRequirementSummaryByConsultation(consultationId, organizationId);
        if (!requirementSummary) {
            throw new app_error_js_1.AppError("Requirement summary is required before estimation", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const features = await estimation_repository_js_1.estimationRepository.findFeaturesByConsultation(consultationId, organizationId);
        if (features.length === 0) {
            throw new app_error_js_1.AppError("Detected features are required before estimation", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const existing = await estimation_repository_js_1.estimationRepository.findByConsultationId(consultationId, organizationId);
        let aiResponse;
        try {
            aiResponse = await ai_orchestrator_js_1.aiOrchestrator.generateConversationReply({
                promptType: prompt_constants_js_1.PROMPT_TYPES.ESTIMATION,
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
                conversationHistory: [],
                userMessage: buildEstimationPrompt(requirementSummary, features),
            });
        }
        catch (error) {
            await estimation_repository_js_1.estimationRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
                model: env_js_1.config.OPENAI_DEFAULT_MODEL,
                promptType: prompt_constants_js_1.PROMPT_TYPES.ESTIMATION,
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
            throw new app_error_js_1.AppError("Failed to generate estimation", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        let parsedEstimation;
        try {
            parsedEstimation = parseEstimationPayload(aiResponse.message.content);
        }
        catch (error) {
            await estimation_repository_js_1.estimationRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.ESTIMATION,
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
                : new app_error_js_1.AppError("Failed to parse estimation", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        const savedEstimation = await estimation_repository_js_1.estimationRepository.runInTransaction(async (tx) => {
            let estimation;
            const payload = {
                requirementSummaryId: requirementSummary.id,
                estimatedHours: Math.round(parsedEstimation.estimatedHours),
                estimatedWeeks: Math.round(parsedEstimation.estimatedWeeks),
                estimatedTeamSize: parsedEstimation.teamSize,
                complexity: parsedEstimation.complexity,
                confidenceScore: parsedEstimation.confidence.toFixed(4),
                assumptions: formatAssumptions(parsedEstimation.assumptions),
                risks: parsedEstimation.risks,
                breakdown: parsedEstimation.breakdown,
                generatedBy: "AI",
            };
            if (existing) {
                estimation = await estimation_repository_js_1.estimationRepository.update(existing.id, organizationId, {
                    ...payload,
                    version: existing.version + 1,
                }, tx);
            }
            else {
                estimation = await estimation_repository_js_1.estimationRepository.create({
                    organizationId,
                    consultationId,
                    ...payload,
                    version: 1,
                }, tx);
            }
            await estimation_repository_js_1.estimationRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.ESTIMATION,
                promptVersion: PROMPT_VERSION,
                requestTokens: aiResponse.usage.promptTokens,
                responseTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
                latencyMs: aiResponse.metadata.latencyMs ?? 0,
                estimatedCost: "0",
                status: "success",
                errorMessage: null,
            }, tx);
            return estimation;
        });
        logger_js_1.logger.info(`Estimation generated for consultation=${consultationId} version=${savedEstimation.version}`);
        return toEstimationDto(savedEstimation);
    }
    async update(organizationId, consultationId, input) {
        const consultation = await estimation_repository_js_1.estimationRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const existing = await estimation_repository_js_1.estimationRepository.findByConsultationId(consultationId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Estimation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const updated = await estimation_repository_js_1.estimationRepository.update(existing.id, organizationId, {
            estimatedHours: input.estimatedHours,
            estimatedWeeks: input.estimatedWeeks,
            estimatedTeamSize: input.estimatedTeamSize,
            assumptions: input.assumptions,
            risks: input.risks,
            breakdown: input.breakdown,
            generatedBy: "USER",
            version: existing.version + 1,
        });
        logger_js_1.logger.info(`Estimation updated for consultation=${consultationId} version=${updated.version}`);
        return toEstimationDto(updated);
    }
}
exports.EstimationService = EstimationService;
exports.estimationService = new EstimationService();
