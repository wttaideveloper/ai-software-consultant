import { config } from "../../config/env.js";
import type { StructuredRequirementSummary } from "../../db/schema/requirement-summaries.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { AI_PROVIDERS } from "../ai/ai.constants.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import type { AIResponse } from "../ai/ai.types.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import type { ConversationPromptMessage } from "../prompts/prompt.types.js";
import type { RequirementSummaryResponseDto } from "./requirement-summary.dto.js";
import {
  requirementSummaryRepository,
  type ConsultationRecord,
  type ConversationMessageRecord,
  type RequirementSummaryRecord,
} from "./requirement-summary.repository.js";
import {
  aiRequirementSummaryPayloadSchema,
  type UpdateRequirementSummaryInput,
} from "./requirement-summary.validation.js";

const PROMPT_VERSION = "1.0.0";

function toResponseDto(
  consultation: ConsultationRecord,
  summary: RequirementSummaryRecord,
): RequirementSummaryResponseDto {
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

function toConversationHistory(
  messages: ConversationMessageRecord[],
): ConversationPromptMessage[] {
  return messages.map((message) => ({
    role: message.senderType,
    content: message.message,
  }));
}

function buildConversationTranscript(
  messages: ConversationMessageRecord[],
): string {
  if (messages.length === 0) {
    return "No conversation messages are available yet.";
  }

  return messages
    .map((message) => `${message.senderType.toUpperCase()}: ${message.message}`)
    .join("\n\n");
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

function parseAiRequirementSummary(content: string): {
  summaryMarkdown: string;
  structuredSummary: StructuredRequirementSummary;
} {
  let parsed: unknown;

  try {
    parsed = extractJsonPayload(content);
  } catch {
    throw new AppError(
      "AI returned an invalid requirement summary format",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const validated = aiRequirementSummaryPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      "AI returned an incomplete requirement summary",
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

export class RequirementSummaryService {
  async get(
    organizationId: string,
    consultationId: string,
  ): Promise<RequirementSummaryResponseDto> {
    const consultation =
      await requirementSummaryRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const summary = await requirementSummaryRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    if (!summary) {
      throw new AppError(
        "Requirement summary not found",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return toResponseDto(consultation, summary);
  }

  async generate(
    organizationId: string,
    consultationId: string,
  ): Promise<RequirementSummaryResponseDto> {
    const consultation =
      await requirementSummaryRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const organization =
      await requirementSummaryRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new AppError("Organization not found", HTTP_STATUS.NOT_FOUND);
    }

    const messages =
      await requirementSummaryRepository.findMessagesByConsultation(
        consultationId,
        organizationId,
      );

    if (messages.length === 0) {
      throw new AppError(
        "Conversation history is required before generating a requirement summary",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existing = await requirementSummaryRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    let aiResponse: AIResponse;

    try {
      aiResponse = await aiOrchestrator.generateConversationReply({
        promptType: PROMPT_TYPES.REQUIREMENT_SUMMARY,
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
        conversationHistory: toConversationHistory(messages),
        userMessage: buildConversationTranscript(messages),
      });
    } catch (error) {
      await requirementSummaryRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: AI_PROVIDERS.OPENAI,
        model: config.OPENAI_DEFAULT_MODEL,
        promptType: PROMPT_TYPES.REQUIREMENT_SUMMARY,
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
        "Failed to generate requirement summary",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    let parsedSummary: {
      summaryMarkdown: string;
      structuredSummary: StructuredRequirementSummary;
    };

    try {
      parsedSummary = parseAiRequirementSummary(aiResponse.message.content);
    } catch (error) {
      await requirementSummaryRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: aiResponse.metadata.provider,
        model: aiResponse.metadata.model,
        promptType: PROMPT_TYPES.REQUIREMENT_SUMMARY,
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
            "Failed to parse requirement summary",
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
    }

    const savedSummary = await requirementSummaryRepository.runInTransaction(
      async (tx) => {
        let summary: RequirementSummaryRecord;

        if (existing) {
          summary = await requirementSummaryRepository.update(
            existing.id,
            organizationId,
            {
              summaryMarkdown: parsedSummary.summaryMarkdown,
              structuredSummary: parsedSummary.structuredSummary,
              version: existing.version + 1,
              status: "draft",
              generatedBy: "AI",
            },
            tx,
          );
        } else {
          summary = await requirementSummaryRepository.create(
            {
              organizationId,
              consultationId,
              summaryMarkdown: parsedSummary.summaryMarkdown,
              structuredSummary: parsedSummary.structuredSummary,
              version: 1,
              status: "draft",
              generatedBy: "AI",
            },
            tx,
          );
        }

        await requirementSummaryRepository.createAiGeneration(
          {
            organizationId,
            consultationId,
            conversationMessageId: null,
            provider: aiResponse.metadata.provider,
            model: aiResponse.metadata.model,
            promptType: PROMPT_TYPES.REQUIREMENT_SUMMARY,
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

        return summary;
      },
    );

    logger.info(
      `Requirement summary generated for consultation=${consultationId} version=${savedSummary.version}`,
    );

    return toResponseDto(consultation, savedSummary);
  }

  async update(
    organizationId: string,
    consultationId: string,
    input: UpdateRequirementSummaryInput,
  ): Promise<RequirementSummaryResponseDto> {
    const consultation =
      await requirementSummaryRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await requirementSummaryRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    if (!existing) {
      throw new AppError(
        "Requirement summary not found",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    const updated = await requirementSummaryRepository.update(
      existing.id,
      organizationId,
      {
        summaryMarkdown: input.summaryMarkdown,
        structuredSummary: input.structuredSummary,
        status: input.status,
        generatedBy: "USER",
        version: existing.version + 1,
      },
    );

    logger.info(
      `Requirement summary updated for consultation=${consultationId} version=${updated.version}`,
    );

    return toResponseDto(consultation, updated);
  }
}

export const requirementSummaryService = new RequirementSummaryService();
