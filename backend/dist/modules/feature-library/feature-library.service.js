"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureLibraryService = exports.FeatureLibraryService = void 0;
const env_js_1 = require("../../config/env.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai/ai.constants.js");
const ai_orchestrator_js_1 = require("../ai/ai.orchestrator.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const feature_library_repository_js_1 = require("./feature-library.repository.js");
const feature_library_validation_js_1 = require("./feature-library.validation.js");
const PROMPT_VERSION = "1.0.0";
function toFeatureLibraryDto(feature) {
    return {
        id: feature.id,
        organizationId: feature.organizationId,
        name: feature.name,
        category: feature.category,
        description: feature.description,
        defaultComplexity: feature.defaultComplexity,
        defaultEstimatedHours: feature.defaultEstimatedHours,
        tags: feature.tags ?? [],
        technologies: feature.technologies ?? [],
        notes: feature.notes,
        isActive: feature.isActive,
        createdAt: feature.createdAt,
        updatedAt: feature.updatedAt,
    };
}
function toDetectedFeatureMatchDto(feature) {
    return {
        id: feature.id,
        featureName: feature.featureName,
        featureCategory: feature.featureCategory,
        description: feature.description,
        priority: feature.priority,
        complexity: feature.complexity,
        confidenceScore: Number(feature.confidenceScore),
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
function parseFeatureMatchingPayload(content) {
    let parsed;
    try {
        parsed = extractJsonPayload(content);
    }
    catch {
        throw new app_error_js_1.AppError("AI returned an invalid feature matching format", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    const validated = feature_library_validation_js_1.aiFeatureMatchingPayloadSchema.safeParse(parsed);
    if (!validated.success) {
        throw new app_error_js_1.AppError("AI returned incomplete feature matching data", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return validated.data.matches;
}
function resolveSafeErrorMessage(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error.message;
    }
    return "AI generation failed";
}
function buildMatchingPrompt(detected, library) {
    return [
        "DETECTED FEATURES JSON:",
        JSON.stringify(detected.map((feature) => ({
            id: feature.id,
            name: feature.featureName,
            category: feature.featureCategory,
            description: feature.description,
            priority: feature.priority,
            complexity: feature.complexity,
        })), null, 2),
        "",
        "FEATURE LIBRARY JSON:",
        JSON.stringify(library.map((feature) => ({
            id: feature.id,
            name: feature.name,
            category: feature.category,
            description: feature.description,
            defaultComplexity: feature.defaultComplexity,
            defaultEstimatedHours: feature.defaultEstimatedHours,
            tags: feature.tags,
            technologies: feature.technologies,
        })), null, 2),
    ].join("\n");
}
class FeatureLibraryService {
    async list(organizationId, query) {
        const filters = {
            organizationId,
            name: query.name,
            category: query.category,
            tag: query.tag,
            isActive: query.isActive,
            page: query.page,
            pageSize: query.pageSize,
        };
        const [total, items] = await Promise.all([
            feature_library_repository_js_1.featureLibraryRepository.countByOrganization(filters),
            feature_library_repository_js_1.featureLibraryRepository.findManyByOrganization(filters),
        ]);
        return {
            items: items.map(toFeatureLibraryDto),
            meta: {
                page: query.page,
                pageSize: query.pageSize,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
            },
        };
    }
    async getById(organizationId, featureId) {
        const feature = await feature_library_repository_js_1.featureLibraryRepository.findByIdAndOrganization(featureId, organizationId);
        if (!feature) {
            throw new app_error_js_1.AppError("Feature library item not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        return toFeatureLibraryDto(feature);
    }
    async create(organizationId, input) {
        const created = await feature_library_repository_js_1.featureLibraryRepository.create({
            organizationId,
            name: input.name,
            category: input.category,
            description: input.description,
            defaultComplexity: input.defaultComplexity,
            defaultEstimatedHours: input.defaultEstimatedHours,
            tags: input.tags,
            technologies: input.technologies,
            notes: input.notes ?? null,
            isActive: input.isActive,
        });
        logger_js_1.logger.info(`Feature library item created: ${created.id}`);
        return toFeatureLibraryDto(created);
    }
    async update(organizationId, featureId, input) {
        const existing = await feature_library_repository_js_1.featureLibraryRepository.findByIdAndOrganization(featureId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Feature library item not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const updated = await feature_library_repository_js_1.featureLibraryRepository.update(featureId, organizationId, {
            name: input.name,
            category: input.category,
            description: input.description,
            defaultComplexity: input.defaultComplexity,
            defaultEstimatedHours: input.defaultEstimatedHours,
            tags: input.tags,
            technologies: input.technologies,
            notes: input.notes === undefined ? undefined : input.notes,
            isActive: input.isActive,
        });
        logger_js_1.logger.info(`Feature library item updated: ${featureId}`);
        return toFeatureLibraryDto(updated);
    }
    async remove(organizationId, featureId) {
        const existing = await feature_library_repository_js_1.featureLibraryRepository.findByIdAndOrganization(featureId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Feature library item not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        await feature_library_repository_js_1.featureLibraryRepository.softDelete(featureId, organizationId);
        logger_js_1.logger.info(`Feature library item soft-deleted: ${featureId}`);
    }
    async matchDetectedFeatures(organizationId, input) {
        const consultation = await feature_library_repository_js_1.featureLibraryRepository.findConsultationByIdAndOrganization(input.consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const organization = await feature_library_repository_js_1.featureLibraryRepository.findOrganizationById(organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const detectedFeatures = await feature_library_repository_js_1.featureLibraryRepository.findDetectedFeaturesByConsultation(input.consultationId, organizationId);
        if (detectedFeatures.length === 0) {
            throw new app_error_js_1.AppError("Detected features are required before feature matching", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const libraryFeatures = await feature_library_repository_js_1.featureLibraryRepository.findActiveByOrganization(organizationId);
        if (libraryFeatures.length === 0) {
            throw new app_error_js_1.AppError("Feature library is empty. Add templates before matching.", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        let aiResponse;
        try {
            aiResponse = await ai_orchestrator_js_1.aiOrchestrator.generateConversationReply({
                promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_MATCHING,
                organization: {
                    id: organization.id,
                    name: organization.name,
                },
                consultation: {
                    id: consultation.id,
                    title: consultation.title,
                    industry: consultation.industry,
                    projectType: consultation.projectType,
                    consultationMode: consultation.consultationMode,
                    budgetRange: consultation.budgetRange,
                    timeline: consultation.timeline,
                    status: consultation.status,
                },
                conversationHistory: [],
                userMessage: buildMatchingPrompt(detectedFeatures, libraryFeatures),
            });
        }
        catch (error) {
            await feature_library_repository_js_1.featureLibraryRepository.createAiGeneration({
                organizationId,
                consultationId: input.consultationId,
                conversationMessageId: null,
                provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
                model: env_js_1.config.OPENAI_DEFAULT_MODEL,
                promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_MATCHING,
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
            throw new app_error_js_1.AppError("Failed to match detected features", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        let parsedMatches;
        try {
            parsedMatches = parseFeatureMatchingPayload(aiResponse.message.content);
        }
        catch (error) {
            await feature_library_repository_js_1.featureLibraryRepository.createAiGeneration({
                organizationId,
                consultationId: input.consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_MATCHING,
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
                : new app_error_js_1.AppError("Failed to parse feature matches", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        const detectedById = new Map(detectedFeatures.map((feature) => [feature.id, feature]));
        const libraryById = new Map(libraryFeatures.map((feature) => [feature.id, feature]));
        const matches = [];
        for (const match of parsedMatches) {
            const detected = detectedById.get(match.detectedFeatureId);
            if (!detected) {
                continue;
            }
            const libraryFeature = match.libraryFeatureId
                ? (libraryById.get(match.libraryFeatureId) ?? null)
                : null;
            matches.push({
                detectedFeature: toDetectedFeatureMatchDto(detected),
                matchedLibraryFeature: libraryFeature
                    ? toFeatureLibraryDto(libraryFeature)
                    : null,
                confidence: match.confidence,
                recommendation: match.recommendation,
            });
        }
        // Ensure every detected feature has a suggestion entry even if AI omitted it.
        for (const detected of detectedFeatures) {
            const alreadyMatched = matches.some((item) => item.detectedFeature.id === detected.id);
            if (alreadyMatched) {
                continue;
            }
            matches.push({
                detectedFeature: toDetectedFeatureMatchDto(detected),
                matchedLibraryFeature: null,
                confidence: 0,
                recommendation: "No library match suggested by AI.",
            });
        }
        await feature_library_repository_js_1.featureLibraryRepository.createAiGeneration({
            organizationId,
            consultationId: input.consultationId,
            conversationMessageId: null,
            provider: aiResponse.metadata.provider,
            model: aiResponse.metadata.model,
            promptType: prompt_constants_js_1.PROMPT_TYPES.FEATURE_MATCHING,
            promptVersion: PROMPT_VERSION,
            requestTokens: aiResponse.usage.promptTokens,
            responseTokens: aiResponse.usage.completionTokens,
            totalTokens: aiResponse.usage.totalTokens,
            latencyMs: aiResponse.metadata.latencyMs ?? 0,
            estimatedCost: "0",
            status: "success",
            errorMessage: null,
        });
        logger_js_1.logger.info(`Feature matching completed for consultation=${input.consultationId} matches=${matches.length}`);
        return {
            consultationId: input.consultationId,
            matches,
        };
    }
}
exports.FeatureLibraryService = FeatureLibraryService;
exports.featureLibraryService = new FeatureLibraryService();
