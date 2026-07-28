import { config } from "../../config/env.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { AI_PROVIDERS } from "../ai/ai.constants.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import type { AIResponse } from "../ai/ai.types.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import type {
  DetectedFeatureMatchDto,
  FeatureLibraryDto,
  FeatureMatchResponseDto,
  FeatureMatchSuggestionDto,
  PaginatedFeatureLibraryDto,
} from "./feature-library.dto.js";
import {
  featureLibraryRepository,
  type DetectedFeatureRecord,
  type FeatureLibraryRecord,
} from "./feature-library.repository.js";
import {
  aiFeatureMatchingPayloadSchema,
  type CreateFeatureLibraryInput,
  type ListFeatureLibraryQuery,
  type MatchDetectedFeaturesInput,
  type UpdateFeatureLibraryInput,
} from "./feature-library.validation.js";

const PROMPT_VERSION = "1.0.0";

function toFeatureLibraryDto(feature: FeatureLibraryRecord): FeatureLibraryDto {
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

function toDetectedFeatureMatchDto(
  feature: DetectedFeatureRecord,
): DetectedFeatureMatchDto {
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

function extractJsonPayload(content: string): unknown {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1].trim()) as unknown;
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as unknown;
    }

    throw new Error("Invalid JSON payload");
  }
}

function parseFeatureMatchingPayload(content: string) {
  let parsed: unknown;

  try {
    parsed = extractJsonPayload(content);
  } catch {
    throw new AppError(
      "AI returned an invalid feature matching format",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const validated = aiFeatureMatchingPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      "AI returned incomplete feature matching data",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return validated.data.matches;
}

function resolveSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  return "AI generation failed";
}

function buildMatchingPrompt(
  detected: DetectedFeatureRecord[],
  library: FeatureLibraryRecord[],
): string {
  return [
    "DETECTED FEATURES JSON:",
    JSON.stringify(
      detected.map((feature) => ({
        id: feature.id,
        name: feature.featureName,
        category: feature.featureCategory,
        description: feature.description,
        priority: feature.priority,
        complexity: feature.complexity,
      })),
      null,
      2,
    ),
    "",
    "FEATURE LIBRARY JSON:",
    JSON.stringify(
      library.map((feature) => ({
        id: feature.id,
        name: feature.name,
        category: feature.category,
        description: feature.description,
        defaultComplexity: feature.defaultComplexity,
        defaultEstimatedHours: feature.defaultEstimatedHours,
        tags: feature.tags,
        technologies: feature.technologies,
      })),
      null,
      2,
    ),
  ].join("\n");
}

export class FeatureLibraryService {
  async list(
    organizationId: string,
    query: ListFeatureLibraryQuery,
  ): Promise<PaginatedFeatureLibraryDto> {
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
      featureLibraryRepository.countByOrganization(filters),
      featureLibraryRepository.findManyByOrganization(filters),
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

  async getById(
    organizationId: string,
    featureId: string,
  ): Promise<FeatureLibraryDto> {
    const feature = await featureLibraryRepository.findByIdAndOrganization(
      featureId,
      organizationId,
    );

    if (!feature) {
      throw new AppError("Feature library item not found", HTTP_STATUS.NOT_FOUND);
    }

    return toFeatureLibraryDto(feature);
  }

  async create(
    organizationId: string,
    input: CreateFeatureLibraryInput,
  ): Promise<FeatureLibraryDto> {
    const created = await featureLibraryRepository.create({
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

    logger.info(`Feature library item created: ${created.id}`);

    return toFeatureLibraryDto(created);
  }

  async update(
    organizationId: string,
    featureId: string,
    input: UpdateFeatureLibraryInput,
  ): Promise<FeatureLibraryDto> {
    const existing = await featureLibraryRepository.findByIdAndOrganization(
      featureId,
      organizationId,
    );

    if (!existing) {
      throw new AppError("Feature library item not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await featureLibraryRepository.update(
      featureId,
      organizationId,
      {
        name: input.name,
        category: input.category,
        description: input.description,
        defaultComplexity: input.defaultComplexity,
        defaultEstimatedHours: input.defaultEstimatedHours,
        tags: input.tags,
        technologies: input.technologies,
        notes: input.notes === undefined ? undefined : input.notes,
        isActive: input.isActive,
      },
    );

    logger.info(`Feature library item updated: ${featureId}`);

    return toFeatureLibraryDto(updated);
  }

  async remove(organizationId: string, featureId: string): Promise<void> {
    const existing = await featureLibraryRepository.findByIdAndOrganization(
      featureId,
      organizationId,
    );

    if (!existing) {
      throw new AppError("Feature library item not found", HTTP_STATUS.NOT_FOUND);
    }

    await featureLibraryRepository.softDelete(featureId, organizationId);
    logger.info(`Feature library item soft-deleted: ${featureId}`);
  }

  async matchDetectedFeatures(
    organizationId: string,
    input: MatchDetectedFeaturesInput,
  ): Promise<FeatureMatchResponseDto> {
    const consultation =
      await featureLibraryRepository.findConsultationByIdAndOrganization(
        input.consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const organization =
      await featureLibraryRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new AppError("Organization not found", HTTP_STATUS.NOT_FOUND);
    }

    const detectedFeatures =
      await featureLibraryRepository.findDetectedFeaturesByConsultation(
        input.consultationId,
        organizationId,
      );

    if (detectedFeatures.length === 0) {
      throw new AppError(
        "Detected features are required before feature matching",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const libraryFeatures =
      await featureLibraryRepository.findActiveByOrganization(organizationId);

    if (libraryFeatures.length === 0) {
      throw new AppError(
        "Feature library is empty. Add templates before matching.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let aiResponse: AIResponse;

    try {
      aiResponse = await aiOrchestrator.generateConversationReply({
        promptType: PROMPT_TYPES.FEATURE_MATCHING,
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
    } catch (error) {
      await featureLibraryRepository.createAiGeneration({
        organizationId,
        consultationId: input.consultationId,
        conversationMessageId: null,
        provider: AI_PROVIDERS.OPENAI,
        model: config.OPENAI_DEFAULT_MODEL,
        promptType: PROMPT_TYPES.FEATURE_MATCHING,
        promptVersion: PROMPT_VERSION,
        requestTokens: 0,
        responseTokens: 0,
        totalTokens: 0,
        latencyMs: 0,
        estimatedCost: "0",
        status: "failed",
        errorMessage: resolveSafeErrorMessage(error),
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "Failed to match detected features",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    let parsedMatches: Array<{
      detectedFeatureId: string;
      libraryFeatureId: string | null;
      confidence: number;
      recommendation: string;
    }>;

    try {
      parsedMatches = parseFeatureMatchingPayload(aiResponse.message.content);
    } catch (error) {
      await featureLibraryRepository.createAiGeneration({
        organizationId,
        consultationId: input.consultationId,
        conversationMessageId: null,
        provider: aiResponse.metadata.provider,
        model: aiResponse.metadata.model,
        promptType: PROMPT_TYPES.FEATURE_MATCHING,
        promptVersion: PROMPT_VERSION,
        requestTokens: aiResponse.usage.promptTokens,
        responseTokens: aiResponse.usage.completionTokens,
        totalTokens: aiResponse.usage.totalTokens,
        latencyMs: aiResponse.metadata.latencyMs ?? 0,
        estimatedCost: "0",
        status: "failed",
        errorMessage: resolveSafeErrorMessage(error),
      });

      throw error instanceof AppError
        ? error
        : new AppError(
            "Failed to parse feature matches",
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
    }

    const detectedById = new Map(
      detectedFeatures.map((feature) => [feature.id, feature]),
    );
    const libraryById = new Map(
      libraryFeatures.map((feature) => [feature.id, feature]),
    );

    const matches: FeatureMatchSuggestionDto[] = [];

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
      const alreadyMatched = matches.some(
        (item) => item.detectedFeature.id === detected.id,
      );
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

    await featureLibraryRepository.createAiGeneration({
      organizationId,
      consultationId: input.consultationId,
      conversationMessageId: null,
      provider: aiResponse.metadata.provider,
      model: aiResponse.metadata.model,
      promptType: PROMPT_TYPES.FEATURE_MATCHING,
      promptVersion: PROMPT_VERSION,
      requestTokens: aiResponse.usage.promptTokens,
      responseTokens: aiResponse.usage.completionTokens,
      totalTokens: aiResponse.usage.totalTokens,
      latencyMs: aiResponse.metadata.latencyMs ?? 0,
      estimatedCost: "0",
      status: "success",
      errorMessage: null,
    });

    logger.info(
      `Feature matching completed for consultation=${input.consultationId} matches=${matches.length}`,
    );

    return {
      consultationId: input.consultationId,
      matches,
    };
  }
}

export const featureLibraryService = new FeatureLibraryService();
