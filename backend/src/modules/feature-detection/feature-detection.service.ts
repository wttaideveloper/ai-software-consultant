import { config } from "../../config/env.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { AI_PROVIDERS } from "../ai/ai.constants.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import type { AIResponse } from "../ai/ai.types.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import type {
  DetectedFeatureDto,
  DetectedFeaturesResponseDto,
} from "./feature-detection.dto.js";
import {
  featureDetectionRepository,
  type DetectedFeatureRecord,
} from "./feature-detection.repository.js";
import {
  aiDetectedFeaturesPayloadSchema,
  type UpdateFeatureInput,
} from "./feature-detection.validation.js";

const PROMPT_VERSION = "1.0.0";
const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

function toFeatureDto(feature: DetectedFeatureRecord): DetectedFeatureDto {
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

function groupFeaturesByCategory(
  features: DetectedFeatureRecord[],
): DetectedFeaturesResponseDto {
  const sorted = [...features].sort((left, right) => {
    const categoryCompare = left.featureCategory.localeCompare(
      right.featureCategory,
    );
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    const priorityCompare =
      PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
    if (priorityCompare !== 0) {
      return priorityCompare;
    }

    return left.featureName.localeCompare(right.featureName);
  });

  const groupsMap = new Map<string, DetectedFeatureDto[]>();

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

function parseDetectedFeatures(content: string) {
  let parsed: unknown;

  try {
    parsed = extractJsonPayload(content);
  } catch {
    throw new AppError(
      "AI returned an invalid feature detection format",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const validated = aiDetectedFeaturesPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      "AI returned incomplete feature detection data",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return validated.data.features;
}

function resolveSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  return "AI generation failed";
}

function buildRequirementSummaryPrompt(
  summaryMarkdown: string,
  structuredSummary: unknown,
): string {
  return [
    "SUMMARY MARKDOWN:",
    summaryMarkdown,
    "",
    "STRUCTURED SUMMARY JSON:",
    JSON.stringify(structuredSummary, null, 2),
  ].join("\n");
}

export class FeatureDetectionService {
  async list(
    organizationId: string,
    consultationId: string,
  ): Promise<DetectedFeaturesResponseDto> {
    const consultation =
      await featureDetectionRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const features = await featureDetectionRepository.findFeaturesByConsultation(
      consultationId,
      organizationId,
    );

    return {
      ...groupFeaturesByCategory(features),
      consultationId,
    };
  }

  async detect(
    organizationId: string,
    consultationId: string,
  ): Promise<DetectedFeaturesResponseDto> {
    const consultation =
      await featureDetectionRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const organization =
      await featureDetectionRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new AppError("Organization not found", HTTP_STATUS.NOT_FOUND);
    }

    const requirementSummary =
      await featureDetectionRepository.findRequirementSummaryByConsultation(
        consultationId,
        organizationId,
      );

    if (!requirementSummary) {
      throw new AppError(
        "Requirement summary is required before feature detection",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    let aiResponse: AIResponse;

    try {
      aiResponse = await aiOrchestrator.generateConversationReply({
        promptType: PROMPT_TYPES.FEATURE_DETECTION,
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
        userMessage: buildRequirementSummaryPrompt(
          requirementSummary.summaryMarkdown,
          requirementSummary.structuredSummary,
        ),
      });
    } catch (error) {
      await featureDetectionRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: AI_PROVIDERS.OPENAI,
        model: config.OPENAI_DEFAULT_MODEL,
        promptType: PROMPT_TYPES.FEATURE_DETECTION,
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
        "Failed to detect features",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    let parsedFeatures: Array<{
      name: string;
      category: string;
      description: string;
      priority: "HIGH" | "MEDIUM" | "LOW";
      complexity: "LOW" | "MEDIUM" | "HIGH";
      confidence: number;
      reasoning: string;
    }>;

    try {
      parsedFeatures = parseDetectedFeatures(aiResponse.message.content);
    } catch (error) {
      await featureDetectionRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: aiResponse.metadata.provider,
        model: aiResponse.metadata.model,
        promptType: PROMPT_TYPES.FEATURE_DETECTION,
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
            "Failed to parse detected features",
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
    }

    const savedFeatures = await featureDetectionRepository.runInTransaction(
      async (tx) => {
        await featureDetectionRepository.softDeleteByConsultation(
          consultationId,
          organizationId,
          tx,
        );

        const created = await featureDetectionRepository.createMany(
          parsedFeatures.map((feature) => ({
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
          })),
          tx,
        );

        await featureDetectionRepository.createAiGeneration(
          {
            organizationId,
            consultationId,
            conversationMessageId: null,
            provider: aiResponse.metadata.provider,
            model: aiResponse.metadata.model,
            promptType: PROMPT_TYPES.FEATURE_DETECTION,
            promptVersion: PROMPT_VERSION,
            requestTokens: aiResponse.usage.promptTokens,
            responseTokens: aiResponse.usage.completionTokens,
            totalTokens: aiResponse.usage.totalTokens,
            latencyMs: aiResponse.metadata.latencyMs ?? 0,
            estimatedCost: "0",
            status: "success",
            errorMessage: null,
          },
          tx,
        );

        return created;
      },
    );

    logger.info(
      `Feature detection completed for consultation=${consultationId} count=${savedFeatures.length}`,
    );

    return {
      ...groupFeaturesByCategory(savedFeatures),
      consultationId,
    };
  }

  async update(
    organizationId: string,
    featureId: string,
    input: UpdateFeatureInput,
  ): Promise<DetectedFeatureDto> {
    const existing =
      await featureDetectionRepository.findFeatureByIdAndOrganization(
        featureId,
        organizationId,
      );

    if (!existing) {
      throw new AppError("Feature not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await featureDetectionRepository.update(
      featureId,
      organizationId,
      {
        featureName: input.featureName,
        featureCategory: input.featureCategory,
        description: input.description,
        priority: input.priority,
        complexity: input.complexity,
        manuallyVerified: input.manuallyVerified,
      },
    );

    logger.info(`Detected feature updated: ${featureId}`);

    return toFeatureDto(updated);
  }

  async remove(organizationId: string, featureId: string): Promise<void> {
    const existing =
      await featureDetectionRepository.findFeatureByIdAndOrganization(
        featureId,
        organizationId,
      );

    if (!existing) {
      throw new AppError("Feature not found", HTTP_STATUS.NOT_FOUND);
    }

    await featureDetectionRepository.softDelete(featureId, organizationId);
    logger.info(`Detected feature soft-deleted: ${featureId}`);
  }
}

export const featureDetectionService = new FeatureDetectionService();
