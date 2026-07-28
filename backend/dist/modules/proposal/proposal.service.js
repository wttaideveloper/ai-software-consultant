"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proposalService = exports.ProposalService = void 0;
const env_js_1 = require("../../config/env.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai/ai.constants.js");
const ai_orchestrator_js_1 = require("../ai/ai.orchestrator.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const proposal_repository_js_1 = require("./proposal.repository.js");
const proposal_validation_js_1 = require("./proposal.validation.js");
const PROMPT_VERSION = "1.1.0";
function toProposalDto(proposal) {
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
function formatTextList(items) {
    return items.map((item) => item.trim()).join("\n");
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
function parseProposalPayload(content) {
    let parsed;
    try {
        parsed = extractJsonPayload(content);
    }
    catch {
        throw new app_error_js_1.AppError("AI returned an invalid proposal format", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    const validated = proposal_validation_js_1.aiProposalPayloadSchema.safeParse(parsed);
    if (!validated.success) {
        throw new app_error_js_1.AppError("AI returned incomplete proposal data", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return validated.data;
}
function resolveSafeErrorMessage(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error.message;
    }
    return "AI generation failed";
}
function buildProposalPrompt(summary, features, estimation) {
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
class ProposalService {
    async get(organizationId, consultationId) {
        const consultation = await proposal_repository_js_1.proposalRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const proposal = await proposal_repository_js_1.proposalRepository.findByConsultationId(consultationId, organizationId);
        if (!proposal) {
            throw new app_error_js_1.AppError("Proposal not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        return toProposalDto(proposal);
    }
    async generate(organizationId, consultationId) {
        const consultation = await proposal_repository_js_1.proposalRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const organization = await proposal_repository_js_1.proposalRepository.findOrganizationById(organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const requirementSummary = await proposal_repository_js_1.proposalRepository.findRequirementSummaryByConsultation(consultationId, organizationId);
        if (!requirementSummary) {
            throw new app_error_js_1.AppError("Requirement summary is required before proposal generation", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const features = await proposal_repository_js_1.proposalRepository.findFeaturesByConsultation(consultationId, organizationId);
        if (features.length === 0) {
            throw new app_error_js_1.AppError("Detected features are required before proposal generation", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const estimation = await proposal_repository_js_1.proposalRepository.findEstimationByConsultation(consultationId, organizationId);
        if (!estimation) {
            throw new app_error_js_1.AppError("Project estimation is required before proposal generation", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const existing = await proposal_repository_js_1.proposalRepository.findByConsultationId(consultationId, organizationId);
        let aiResponse;
        try {
            aiResponse = await ai_orchestrator_js_1.aiOrchestrator.generateConversationReply({
                promptType: prompt_constants_js_1.PROMPT_TYPES.PROPOSAL,
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
                userMessage: buildProposalPrompt(requirementSummary, features, estimation),
            });
        }
        catch (error) {
            await proposal_repository_js_1.proposalRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
                model: env_js_1.config.OPENAI_DEFAULT_MODEL,
                promptType: prompt_constants_js_1.PROMPT_TYPES.PROPOSAL,
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
            throw new app_error_js_1.AppError("Failed to generate proposal", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        let parsedProposal;
        try {
            parsedProposal = parseProposalPayload(aiResponse.message.content);
        }
        catch (error) {
            await proposal_repository_js_1.proposalRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.PROPOSAL,
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
                : new app_error_js_1.AppError("Failed to parse proposal", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        const savedProposal = await proposal_repository_js_1.proposalRepository.runInTransaction(async (tx) => {
            let proposal;
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
                generatedBy: "AI",
                status: "DRAFT",
            };
            if (existing) {
                proposal = await proposal_repository_js_1.proposalRepository.update(existing.id, organizationId, {
                    ...payload,
                    version: existing.version + 1,
                }, tx);
            }
            else {
                proposal = await proposal_repository_js_1.proposalRepository.create({
                    organizationId,
                    consultationId,
                    ...payload,
                    version: 1,
                }, tx);
            }
            await proposal_repository_js_1.proposalRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: null,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.PROPOSAL,
                promptVersion: PROMPT_VERSION,
                requestTokens: aiResponse.usage.promptTokens,
                responseTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
                latencyMs: aiResponse.metadata.latencyMs ?? 0,
                estimatedCost: "0",
                status: "success",
                errorMessage: null,
            }, tx);
            return proposal;
        });
        logger_js_1.logger.info(`Proposal generated for consultation=${consultationId} version=${savedProposal.version}`);
        return toProposalDto(savedProposal);
    }
    async update(organizationId, consultationId, input) {
        const consultation = await proposal_repository_js_1.proposalRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const existing = await proposal_repository_js_1.proposalRepository.findByConsultationId(consultationId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Proposal not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const updated = await proposal_repository_js_1.proposalRepository.update(existing.id, organizationId, {
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
        });
        logger_js_1.logger.info(`Proposal updated for consultation=${consultationId} version=${updated.version}`);
        return toProposalDto(updated);
    }
}
exports.ProposalService = ProposalService;
exports.proposalService = new ProposalService();
