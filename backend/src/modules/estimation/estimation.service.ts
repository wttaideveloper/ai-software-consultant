import { config } from "../../config/env.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { AI_PROVIDERS } from "../ai/ai.constants.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import type { AIResponse } from "../ai/ai.types.js";
import { costSettingsService } from "../cost/cost.service.js";
import { normalizeConsultationMode } from "../../shared/constants/consultation-mode.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import {
  normalizeEstimateForMode,
  type ModeNormalizedEstimate,
} from "./estimation.mode.js";
import type { EstimationDto } from "./estimation.dto.js";
import {
  estimationRepository,
  type DetectedFeatureRecord,
  type ProjectEstimationRecord,
  type RequirementSummaryRecord,
} from "./estimation.repository.js";
import {
  aiEstimationPayloadSchema,
  type UpdateEstimationInput,
} from "./estimation.validation.js";

const PROMPT_VERSION = "1.1.0";

function toEstimationDto(
  estimation: ProjectEstimationRecord,
  pricing: EstimationDto["pricing"] = null,
): EstimationDto {
  return {
    pricing,
    id: estimation.id,
    organizationId: estimation.organizationId,
    consultationId: estimation.consultationId,
    requirementSummaryId: estimation.requirementSummaryId,
    estimatedHours: estimation.estimatedHours,
    estimatedWeeks: estimation.estimatedWeeks,
    modePlan: estimation.modePlan,
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

/**
 * Prices an estimate through the Cost Management engine.
 *
 * The AI is deliberately never asked for a cost — it produces hours, complexity
 * and a breakdown, and the price is derived from the organization's rate card so
 * pricing policy stays configurable and consistent across every estimate.
 *
 * `projectType` is passed as a platform label (resolved via the alias table);
 * consultations carry no explicit platform list, so anything unrecognised is
 * reported as unpriced rather than guessed at.
 *
 * A pricing failure is logged and swallowed: an estimate is still useful without
 * a price, and a misconfigured rate card must not make the estimate unreadable.
 */
async function priceEstimation(
  estimation: ProjectEstimationRecord,
  projectType: string | null,
): Promise<EstimationDto["pricing"]> {
  try {
    return await costSettingsService.priceAiEstimate(estimation.organizationId, {
      estimatedHours: estimation.estimatedHours,
      complexity: estimation.complexity,
      platformLabels: projectType ? [projectType] : [],
    });
  } catch (error) {
    logger.error(
      `Failed to price estimation ${estimation.id}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
    return null;
  }
}

function formatAssumptions(assumptions: string[]): string {
  return assumptions.map((item) => item.trim()).join("\n");
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

function parseEstimationPayload(content: string) {
  let parsed: unknown;

  try {
    parsed = extractJsonPayload(content);
  } catch {
    throw new AppError(
      "AI returned an invalid estimation format",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const validated = aiEstimationPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      "AI returned incomplete estimation data",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return validated.data;
}

function resolveSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  return "AI generation failed";
}

function buildEstimationPrompt(
  summary: RequirementSummaryRecord,
  features: DetectedFeatureRecord[],
): string {
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

export class EstimationService {
  async get(
    organizationId: string,
    consultationId: string,
  ): Promise<EstimationDto> {
    const consultation =
      await estimationRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const estimation = await estimationRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    if (!estimation) {
      throw new AppError("Estimation not found", HTTP_STATUS.NOT_FOUND);
    }

    return toEstimationDto(
      estimation,
      await priceEstimation(estimation, consultation.projectType),
    );
  }

  async generate(
    organizationId: string,
    consultationId: string,
  ): Promise<EstimationDto> {
    const consultation =
      await estimationRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const organization =
      await estimationRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new AppError("Organization not found", HTTP_STATUS.NOT_FOUND);
    }

    const requirementSummary =
      await estimationRepository.findRequirementSummaryByConsultation(
        consultationId,
        organizationId,
      );

    if (!requirementSummary) {
      throw new AppError(
        "Requirement summary is required before estimation",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const features = await estimationRepository.findFeaturesByConsultation(
      consultationId,
      organizationId,
    );

    if (features.length === 0) {
      throw new AppError(
        "Detected features are required before estimation",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existing = await estimationRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    let aiResponse: AIResponse;

    try {
      aiResponse = await aiOrchestrator.generateConversationReply({
        promptType: PROMPT_TYPES.ESTIMATION,
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
        userMessage: buildEstimationPrompt(requirementSummary, features),
      });
    } catch (error) {
      await estimationRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: AI_PROVIDERS.OPENAI,
        model: config.OPENAI_DEFAULT_MODEL,
        promptType: PROMPT_TYPES.ESTIMATION,
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
        "Failed to generate estimation",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    let parsedEstimation: ModeNormalizedEstimate;

    try {
      parsedEstimation = normalizeEstimateForMode(
        parseEstimationPayload(aiResponse.message.content),
        normalizeConsultationMode(consultation.consultationMode),
      );
    } catch (error) {
      await estimationRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: aiResponse.metadata.provider,
        model: aiResponse.metadata.model,
        promptType: PROMPT_TYPES.ESTIMATION,
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
            "Failed to parse estimation",
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
    }

    const savedEstimation = await estimationRepository.runInTransaction(
      async (tx) => {
        let estimation: ProjectEstimationRecord;

        const payload = {
          requirementSummaryId: requirementSummary.id,
          estimatedHours: Math.round(parsedEstimation.estimatedHours),
          // Null only for MAINTENANCE, which has no delivery date.
          estimatedWeeks:
            parsedEstimation.estimatedWeeks === null
              ? null
              : Math.round(parsedEstimation.estimatedWeeks),
          estimatedTeamSize: parsedEstimation.teamSize,
          complexity: parsedEstimation.complexity,
          confidenceScore: parsedEstimation.confidence.toFixed(4),
          assumptions: formatAssumptions(parsedEstimation.assumptions),
          risks: parsedEstimation.risks,
          breakdown: parsedEstimation.breakdown,
          modePlan: {
            maintenancePlan: parsedEstimation.maintenancePlan ?? null,
            migrationPlan: parsedEstimation.migrationPlan ?? null,
            enhancementImpact: parsedEstimation.enhancementImpact ?? null,
          },
          generatedBy: "AI" as const,
        };

        if (existing) {
          estimation = await estimationRepository.update(
            existing.id,
            organizationId,
            {
              ...payload,
              version: existing.version + 1,
            },
            tx,
          );
        } else {
          estimation = await estimationRepository.create(
            {
              organizationId,
              consultationId,
              ...payload,
              version: 1,
            },
            tx,
          );
        }

        await estimationRepository.createAiGeneration(
          {
            organizationId,
            consultationId,
            conversationMessageId: null,
            provider: aiResponse.metadata.provider,
            model: aiResponse.metadata.model,
            promptType: PROMPT_TYPES.ESTIMATION,
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

        return estimation;
      },
    );

    logger.info(
      `Estimation generated for consultation=${consultationId} version=${savedEstimation.version}`,
    );

    // Cost is calculated here, from the rate card — the AI returned effort only.
    return toEstimationDto(
      savedEstimation,
      await priceEstimation(savedEstimation, consultation.projectType),
    );
  }

  async update(
    organizationId: string,
    consultationId: string,
    input: UpdateEstimationInput,
  ): Promise<EstimationDto> {
    const consultation =
      await estimationRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await estimationRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    if (!existing) {
      throw new AppError("Estimation not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await estimationRepository.update(
      existing.id,
      organizationId,
      {
        estimatedHours: input.estimatedHours,
        estimatedWeeks: input.estimatedWeeks,
        estimatedTeamSize: input.estimatedTeamSize,
        assumptions: input.assumptions,
        risks: input.risks,
        breakdown: input.breakdown,
        generatedBy: "USER",
        version: existing.version + 1,
      },
    );

    logger.info(
      `Estimation updated for consultation=${consultationId} version=${updated.version}`,
    );

    // Re-priced after a manual hours/complexity edit, so the figure on screen
    // always matches the effort beside it.
    return toEstimationDto(
      updated,
      await priceEstimation(updated, consultation.projectType),
    );
  }
}

export const estimationService = new EstimationService();
