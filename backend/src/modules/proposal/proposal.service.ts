import { config } from "../../config/env.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { AI_PROVIDERS } from "../ai/ai.constants.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import type { AIResponse } from "../ai/ai.types.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import type { ProposalDto } from "./proposal.dto.js";
import {
  proposalRepository,
  type DetectedFeatureRecord,
  type ProjectEstimationRecord,
  type ProjectProposalRecord,
  type RequirementSummaryRecord,
} from "./proposal.repository.js";
import {
  aiProposalPayloadSchema,
  type UpdateProposalInput,
} from "./proposal.validation.js";

const PROMPT_VERSION = "1.1.0";

function toProposalDto(proposal: ProjectProposalRecord): ProposalDto {
  return {
    id: proposal.id,
    organizationId: proposal.organizationId,
    consultationId: proposal.consultationId,
    requirementSummaryId: proposal.requirementSummaryId,
    estimationId: proposal.estimationId,
    title: proposal.title,
    executiveSummary: proposal.executiveSummary,
    scopeOfWork: proposal.scopeOfWork,
    deliverables: proposal.deliverables,
    timeline: proposal.timeline,
    assumptions: proposal.assumptions,
    exclusions: proposal.exclusions,
    pricingNotes: proposal.pricingNotes,
    proposalMarkdown: proposal.proposalMarkdown,
    generatedBy: proposal.generatedBy,
    version: proposal.version,
    status: proposal.status,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}

function formatTextList(items: string[]): string {
  return items.map((item) => item.trim()).join("\n");
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

function parseProposalPayload(content: string) {
  let parsed: unknown;

  try {
    parsed = extractJsonPayload(content);
  } catch {
    throw new AppError(
      "AI returned an invalid proposal format",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const validated = aiProposalPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      "AI returned incomplete proposal data",
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

function buildProposalPrompt(
  summary: RequirementSummaryRecord,
  features: DetectedFeatureRecord[],
  estimation: ProjectEstimationRecord,
): string {
  const featurePayload = features.map((feature) => ({
    name: feature.featureName,
    category: feature.featureCategory,
    description: feature.description,
    priority: feature.priority,
    complexity: feature.complexity,
    confidence: Number(feature.confidenceScore),
  }));

  const estimationPayload = {
    estimatedHours: estimation.estimatedHours,
    estimatedWeeks: estimation.estimatedWeeks,
    teamSize: estimation.estimatedTeamSize,
    complexity: estimation.complexity,
    confidence: Number(estimation.confidenceScore),
    assumptions: estimation.assumptions,
    risks: estimation.risks,
    breakdown: estimation.breakdown,
  };

  return [
    "REQUIREMENT SUMMARY MARKDOWN:",
    summary.summaryMarkdown,
    "",
    "STRUCTURED SUMMARY JSON:",
    JSON.stringify(summary.structuredSummary, null, 2),
    "",
    "DETECTED FEATURES JSON:",
    JSON.stringify(featurePayload, null, 2),
    "",
    "PROJECT ESTIMATION JSON:",
    JSON.stringify(estimationPayload, null, 2),
  ].join("\n");
}

export class ProposalService {
  async get(
    organizationId: string,
    consultationId: string,
  ): Promise<ProposalDto> {
    const consultation =
      await proposalRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const proposal = await proposalRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    if (!proposal) {
      throw new AppError("Proposal not found", HTTP_STATUS.NOT_FOUND);
    }

    return toProposalDto(proposal);
  }

  async generate(
    organizationId: string,
    consultationId: string,
  ): Promise<ProposalDto> {
    const consultation =
      await proposalRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const organization =
      await proposalRepository.findOrganizationById(organizationId);

    if (!organization) {
      throw new AppError("Organization not found", HTTP_STATUS.NOT_FOUND);
    }

    const requirementSummary =
      await proposalRepository.findRequirementSummaryByConsultation(
        consultationId,
        organizationId,
      );

    if (!requirementSummary) {
      throw new AppError(
        "Requirement summary is required before proposal generation",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const features = await proposalRepository.findFeaturesByConsultation(
      consultationId,
      organizationId,
    );

    if (features.length === 0) {
      throw new AppError(
        "Detected features are required before proposal generation",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const estimation = await proposalRepository.findEstimationByConsultation(
      consultationId,
      organizationId,
    );

    if (!estimation) {
      throw new AppError(
        "Project estimation is required before proposal generation",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const existing = await proposalRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    let aiResponse: AIResponse;

    try {
      aiResponse = await aiOrchestrator.generateConversationReply({
        promptType: PROMPT_TYPES.PROPOSAL,
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
        userMessage: buildProposalPrompt(
          requirementSummary,
          features,
          estimation,
        ),
      });
    } catch (error) {
      await proposalRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: AI_PROVIDERS.OPENAI,
        model: config.OPENAI_DEFAULT_MODEL,
        promptType: PROMPT_TYPES.PROPOSAL,
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
        "Failed to generate proposal",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    let parsedProposal: ReturnType<typeof parseProposalPayload>;

    try {
      parsedProposal = parseProposalPayload(aiResponse.message.content);
    } catch (error) {
      await proposalRepository.createAiGeneration({
        organizationId,
        consultationId,
        conversationMessageId: null,
        provider: aiResponse.metadata.provider,
        model: aiResponse.metadata.model,
        promptType: PROMPT_TYPES.PROPOSAL,
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
            "Failed to parse proposal",
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
    }

    const savedProposal = await proposalRepository.runInTransaction(
      async (tx) => {
        let proposal: ProjectProposalRecord;

        const payload = {
          requirementSummaryId: requirementSummary.id,
          estimationId: estimation.id,
          title: parsedProposal.title,
          executiveSummary: parsedProposal.executiveSummary,
          scopeOfWork: parsedProposal.scopeOfWork,
          deliverables: parsedProposal.deliverables,
          timeline: parsedProposal.timeline,
          assumptions: formatTextList(parsedProposal.assumptions),
          exclusions: formatTextList(parsedProposal.exclusions),
          pricingNotes: parsedProposal.pricingNotes,
          proposalMarkdown: parsedProposal.proposalMarkdown,
          generatedBy: "AI" as const,
          status: "DRAFT" as const,
        };

        if (existing) {
          proposal = await proposalRepository.update(
            existing.id,
            organizationId,
            {
              ...payload,
              version: existing.version + 1,
            },
            tx,
          );
        } else {
          proposal = await proposalRepository.create(
            {
              organizationId,
              consultationId,
              ...payload,
              version: 1,
            },
            tx,
          );
        }

        await proposalRepository.createAiGeneration(
          {
            organizationId,
            consultationId,
            conversationMessageId: null,
            provider: aiResponse.metadata.provider,
            model: aiResponse.metadata.model,
            promptType: PROMPT_TYPES.PROPOSAL,
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

        return proposal;
      },
    );

    logger.info(
      `Proposal generated for consultation=${consultationId} version=${savedProposal.version}`,
    );

    return toProposalDto(savedProposal);
  }

  async update(
    organizationId: string,
    consultationId: string,
    input: UpdateProposalInput,
  ): Promise<ProposalDto> {
    const consultation =
      await proposalRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await proposalRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    if (!existing) {
      throw new AppError("Proposal not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await proposalRepository.update(
      existing.id,
      organizationId,
      {
        title: input.title,
        executiveSummary: input.executiveSummary,
        scopeOfWork: input.scopeOfWork,
        deliverables: input.deliverables,
        timeline: input.timeline,
        assumptions: input.assumptions,
        exclusions: input.exclusions,
        pricingNotes: input.pricingNotes,
        proposalMarkdown: input.proposalMarkdown,
        status: input.status,
        generatedBy: "USER",
        version: existing.version + 1,
      },
    );

    logger.info(
      `Proposal updated for consultation=${consultationId} version=${updated.version}`,
    );

    return toProposalDto(updated);
  }
}

export const proposalService = new ProposalService();
