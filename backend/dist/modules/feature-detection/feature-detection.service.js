"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureDetectionService = exports.FeatureDetectionService = void 0;
const env_js_1 = require("../../config/env.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai/ai.constants.js");
const ai_orchestrator_js_1 = require("../ai/ai.orchestrator.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const feature_detection_repository_js_1 = require("./feature-detection.repository.js");
const feature_detection_validation_js_1 = require("./feature-detection.validation.js");
const PROMPT_VERSION = "1.0.0";
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
function toFeatureDto(feature) {
    return {
        id: feature.id,
        organizationId: feature.organizationId,
        consultationId: feature.consultationId,
        requirementSummaryId: feature.requirementSummaryId,
        featureName: feature.featureName,
        featureCategory: feature.featureCategory,
        description: feature.description,
        priority: feature.priority,
        complexity: feature.complexity,
        confidenceScore: Number(feature.confidenceScore),
        aiReasoning: feature.aiReasoning,
        manuallyVerified: feature.manuallyVerified,
        createdAt: feature.createdAt,
        updatedAt: feature.updatedAt,
    };
}
function groupFeaturesByCategory(features) {
    const sorted = [...features].sort((left, right) => {
        const categoryCompare = left.featureCategory.localeCompare(right.featureCategory);
        if (categoryCompare !== 0) {
            return categoryCompare;
        }
        const priorityCompare = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
        if (priorityCompare !== 0) {
            return priorityCompare;
        }
        return left.featureName.localeCompare(right.featureName);
    });
    const groupsMap = new Map();
    for (const feature of sorted) {
        const current = groupsMap.get(feature.featureCategory) ?? [];
        current.push(toFeatureDto(feature));
        groupsMap.set(feature.featureCategory, current);
    }
    return {
        consultationId: features[0]?.consultationId ?? "",
        total: features.length,
        groups: Array.from(groupsMap.entries()).map(([category, items]) => ({
            category,
            features: items,
        })),
    };
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
function parseDetectedFeatures(content) {
    let parsed;
    try {
        parsed = extractJsonPayload(content);
    }
    catch {
        throw new app_error_js_1.AppError("AI returned an invalid feature detection format", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    const validated = feature_detection_validation_js_1.aiDetectedFeaturesPayloadSchema.safeParse(parsed);
    if (!validated.success) {
        throw new app_error_js_1.AppError("AI returned incomplete feature detection data", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return validated.data.features;
}
function resolveSafeErrorMessage(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error.message;
    }
    return "AI generation failed";
}
function buildRequirementSummaryPrompt(summaryMarkdown, structuredSummary) {
    return [
        "SUMMARY MARKDOWN:",
        summaryMarkdown,
        "",
        "STRUCTURED SUMMARY JSON:",
        JSON.stringify(structuredSummary, null, 2),
    ].join("\n");
}
class FeatureDetectionService {
    async list(organizationId, consultationId) {
        const consultation = await feature_detection_repository_js_1.featureDetectionRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const features = await feature_detection_repository_js_1.featureDetectionRepository.findFeaturesByConsultation(consultationId, organizationId);
        return {
            ...groupFeaturesByCategory(features),
            consultationId,
        };
    }
    async detect(organizationId, consultationId) {
        const consultation = await feature_detection_repository_js_1.featureDetectionRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const organization = await feature_detection_repository_js_1.featureDetectionRepository.findOrganizationById(organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const requirementSummary = await feature_detection_repository_js_1.featureDetectionRepository.findRequirementSummaryByConsultation(consultationId, organizationId);
        if (!requirementSummary) {
            throw new app_error_js_1.AppError("Requirement summary is required before feature detection", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        let aiResponse;
        try {
            aiResponse = await ai_orchestrator_js_1.aiOrchestrator.generateConversationReply({
                promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_DETECTION,
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
                userMessage: buildRequirementSummaryPrompt(requirementSummary.summaryMarkdown, requirementSummary.structuredSummary),
            });
        }
        catch (error) {
            await feature_detection_repository_js_1.featureDetectionRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
                model: env_js_1.config.OPENAI_DEFAULT_MODEL,
                promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_DETECTION,
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
            throw new app_error_js_1.AppError("Failed to detect features", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        let parsedFeatures;
        try {
            parsedFeatures = parseDetectedFeatures(aiResponse.message.content);
        }
        catch (error) {
            await feature_detection_repository_js_1.featureDetectionRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_DETECTION,
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
                : new app_error_js_1.AppError("Failed to parse detected features", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        const savedFeatures = await feature_detection_repository_js_1.featureDetectionRepository.runInTransaction(async (tx) => {
            await feature_detection_repository_js_1.featureDetectionRepository.softDeleteByConsultation(consultationId, organizationId, tx);
            const created = await feature_detection_repository_js_1.featureDetectionRepository.createMany(parsedFeatures.map((feature) => ({
                organizationId,
                consultationId,
                requirementSummaryId: requirementSummary.id,
                featureName: feature.name,
                featureCategory: feature.category,
                description: feature.description,
                priority: feature.priority,
                complexity: feature.complexity,
                confidenceScore: feature.confidence.toFixed(4),
                aiReasoning: feature.reasoning,
            })), tx);
            await feature_detection_repository_js_1.featureDetectionRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_DETECTION,
                promptVersion: PROMPT_VERSION,
                requestTokens: aiResponse.usage.promptTokens,
                responseTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
                latencyMs: aiResponse.metadata.latencyMs ?? 0,
                estimatedCost: "0",
                status: "success",
                errorMessage: null,
            }, tx);
            return created;
        });
        logger_js_1.logger.info(`Feature detection completed for consultation=${consultationId} count=${savedFeatures.length}`);
        return {
            ...groupFeaturesByCategory(savedFeatures),
            consultationId,
        };
    }
    async update(organizationId, featureId, input) {
        const existing = await feature_detection_repository_js_1.featureDetectionRepository.findFeatureByIdAndOrganization(featureId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Feature not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const updated = await feature_detection_repository_js_1.featureDetectionRepository.update(featureId, organizationId, {
            featureName: input.featureName,
            featureCategory: input.featureCategory,
            description: input.description,
            priority: input.priority,
            complexity: input.complexity,
            manuallyVerified: input.manuallyVerified,
        });
        logger_js_1.logger.info(`Detected feature updated: ${featureId}`);
        return toFeatureDto(updated);
    }
    async remove(organizationId, featureId) {
        const existing = await feature_detection_repository_js_1.featureDetectionRepository.findFeatureByIdAndOrganization(featureId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Feature not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        await feature_detection_repository_js_1.featureDetectionRepository.softDelete(featureId, organizationId);
        logger_js_1.logger.info(`Detected feature soft-deleted: ${featureId}`);
    }
}
exports.FeatureDetectionService = FeatureDetectionService;
exports.featureDetectionService = new FeatureDetectionService();
