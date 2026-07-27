"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const env_js_1 = require("../../config/env.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai/ai.constants.js");
const ai_orchestrator_js_1 = require("../ai/ai.orchestrator.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const chat_repository_js_1 = require("./chat.repository.js");
const chat_validation_js_1 = require("./chat.validation.js");
const PROMPT_VERSION = "1.4.0";
const DISCOVERY_COMPLETE_MESSAGE = "Thank you. I now have sufficient information to prepare the project requirements.";
const GROUP_A_TOPICS = [
    "projectOverview",
    "businessGoals",
    "targetUsers",
    "applications",
    "coreModules",
];
// Group B, Tier 1: business-critical — these carry real weight toward
// completion. Marking one not_applicable must reflect an actual relevance
// judgment, not a shortcut (see the relevance guardrails in the prompt).
const GROUP_B_TIER1_TOPICS = [
    "payment",
    "authentication",
    "adminPanel",
    "notifications",
    "integrations",
];
// Group B, Tier 2: optional — these never count toward the completion
// threshold on their own. Missing ones simply become assumptions.
const GROUP_B_TIER2_TOPICS = [
    "reporting",
    "search",
    "fileUploads",
    "locationMaps",
    "thirdPartyApis",
    "aiFeatures",
];
/**
 * Timeline and Budget used to head this list. They were removed because a topic
 * here is something the AI is licensed to ask the client about, and the client is
 * never asked how long the project should take or what it should cost — the system
 * derives effort in estimation.service.ts and price in cost.engine.ts once the
 * requirements are known. Compliance and Performance took their place as genuine
 * requirement topics. Do not reintroduce a commercial topic here.
 */
const GROUP_C_TOPICS = [
    "deployment",
    "security",
    "compliance",
    "performance",
    "scalability",
    "futureEnhancements",
];
const MIN_TIER1_ANSWERED = 2;
const DISCOVERY_TOPIC_LABELS = {
    projectOverview: "Project Overview",
    businessGoals: "Business Goals",
    targetUsers: "Target Users",
    applications: "Applications/Platforms",
    coreModules: "Core Functional Modules",
    payment: "Payment",
    notifications: "Notifications",
    authentication: "Authentication",
    adminPanel: "Admin Panel",
    integrations: "Integrations",
    reporting: "Reporting",
    search: "Search",
    fileUploads: "File Uploads",
    locationMaps: "Location/Maps",
    thirdPartyApis: "Third-party APIs",
    aiFeatures: "AI Features",
    deployment: "Deployment",
    security: "Security",
    compliance: "Compliance",
    performance: "Performance Expectations",
    scalability: "Scalability",
    futureEnhancements: "Future Enhancements",
};
const ALL_DISCOVERY_TOPIC_KEYS = [
    ...GROUP_A_TOPICS,
    ...GROUP_B_TIER1_TOPICS,
    ...GROUP_B_TIER2_TOPICS,
    ...GROUP_C_TOPICS,
];
function defaultDiscoveryTopics() {
    return Object.fromEntries(ALL_DISCOVERY_TOPIC_KEYS.map((key) => [key, "missing"]));
}
/**
 * Coverage is computed here, in code, from the model's per-topic assessment.
 * The model is never asked whether discovery is "done" — it only reports
 * topic status; this function is the sole source of truth for completion.
 *
 * Only Group B Tier 1 (business-critical) topics count toward the
 * completion threshold. Tier 2 (optional) topics never determine
 * completion by themselves — see GROUP_B_TIER2_TOPICS.
 */
function evaluateCoverage(topics) {
    const groupAComplete = GROUP_A_TOPICS.every((key) => topics[key] === "complete");
    const tier1AnsweredCount = GROUP_B_TIER1_TOPICS.filter((key) => topics[key] === "complete" || topics[key] === "not_applicable").length;
    return {
        groupAComplete,
        tier1AnsweredCount,
        coverageComplete: groupAComplete && tier1AnsweredCount >= MIN_TIER1_ANSWERED,
    };
}
function toChatMessageDto(message) {
    return {
        id: message.id,
        consultationId: message.consultationId,
        organizationId: message.organizationId,
        senderType: message.senderType,
        message: message.message,
        metadata: message.metadata ?? null,
        createdBy: message.createdBy,
        createdAt: message.createdAt,
    };
}
function toConversationHistory(messages) {
    return messages.map((message) => ({
        role: message.senderType,
        content: message.message,
    }));
}
function resolveSafeErrorMessage(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error.message;
    }
    return "AI generation failed";
}
function extractTopicsFromMetadata(metadata) {
    const parsed = chat_validation_js_1.discoveryTopicsSchema.safeParse(metadata?.["topics"]);
    return parsed.success ? parsed.data : undefined;
}
function summarizeKnownTopics(topics) {
    return ALL_DISCOVERY_TOPIC_KEYS.map((key) => `${DISCOVERY_TOPIC_LABELS[key]}: ${topics[key]}`).join("; ");
}
function summarizeCoverageStatus(topics, coverage, questionsAsked, maxClarificationQuestions) {
    const missingGroupA = GROUP_A_TOPICS.filter((key) => topics[key] !== "complete").map((key) => DISCOVERY_TOPIC_LABELS[key]);
    const groupAText = coverage.groupAComplete
        ? "Group A (mandatory) topics are all complete."
        : `Group A (mandatory) topics still missing: ${missingGroupA.join(", ")}.`;
    const missingTier1 = GROUP_B_TIER1_TOPICS.filter((key) => topics[key] !== "complete" && topics[key] !== "not_applicable").map((key) => DISCOVERY_TOPIC_LABELS[key]);
    const tier1Text = `Group B Tier 1 (business-critical) topics answered or confirmed not applicable: ${coverage.tier1AnsweredCount}/${MIN_TIER1_ANSWERED} minimum required${missingTier1.length ? ` (still unresolved: ${missingTier1.join(", ")})` : ""}. Tier 2 (optional) topics never count toward this threshold.`;
    const verdictText = coverage.coverageComplete
        ? "Coverage is already sufficient to complete discovery."
        : "Coverage is not yet sufficient — discovery must continue.";
    return `${groupAText} ${tier1Text} Questions asked so far: ${questionsAsked}/${maxClarificationQuestions}. ${verdictText}`;
}
function countQuestionsAsked(messages) {
    return messages.filter((message) => {
        if (message.senderType !== "assistant") {
            return false;
        }
        const metadata = message.metadata;
        return metadata?.["discoveryComplete"] !== true;
    }).length;
}
/**
 * Deterministic fallback topic selection, following the same priority order
 * given to the model: incomplete Group A first (in order), then a missing
 * Tier 1 topic, then Tier 2 only once Tier 1 threshold is met, then Group C.
 * Used when the model's own reply isn't trustworthy as an actual question
 * (see the `?`-ending check in chat()) so the user is never left stalled.
 */
function pickNextTopic(topics, coverage) {
    const missingGroupA = GROUP_A_TOPICS.find((key) => topics[key] !== "complete");
    if (missingGroupA) {
        return missingGroupA;
    }
    const missingTier1 = GROUP_B_TIER1_TOPICS.find((key) => topics[key] !== "complete" && topics[key] !== "not_applicable");
    if (missingTier1) {
        return missingTier1;
    }
    if (coverage.tier1AnsweredCount < MIN_TIER1_ANSWERED) {
        return null;
    }
    const missingTier2 = GROUP_B_TIER2_TOPICS.find((key) => topics[key] !== "complete" && topics[key] !== "not_applicable");
    if (missingTier2) {
        return missingTier2;
    }
    return (GROUP_C_TOPICS.find((key) => topics[key] !== "complete" && topics[key] !== "not_applicable") ?? null);
}
function buildFinalAssumptions(topics, modelAssumptions) {
    const assumptions = [...modelAssumptions];
    for (const key of ALL_DISCOVERY_TOPIC_KEYS) {
        if (topics[key] === "complete" || topics[key] === "not_applicable") {
            continue;
        }
        const label = DISCOVERY_TOPIC_LABELS[key];
        const alreadyMentioned = assumptions.some((line) => line.toLowerCase().includes(label.toLowerCase()));
        if (!alreadyMentioned) {
            assumptions.push(`Assumed default approach for ${label} since it was not explicitly discussed.`);
        }
    }
    return assumptions;
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
function parseDiscoveryPayload(content) {
    let parsed;
    try {
        parsed = extractJsonPayload(content);
    }
    catch {
        throw new app_error_js_1.AppError("AI returned an invalid discovery response format", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    const validated = chat_validation_js_1.aiDiscoveryPayloadSchema.safeParse(parsed);
    if (!validated.success) {
        throw new app_error_js_1.AppError("AI returned an incomplete discovery response", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return validated.data;
}
class ChatService {
    async chat(organizationId, consultationId, userId, message) {
        const consultation = await chat_repository_js_1.chatRepository.findConsultationByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const organization = await chat_repository_js_1.chatRepository.findOrganizationById(organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const userMessage = await chat_repository_js_1.chatRepository.createMessage({
            consultationId,
            organizationId,
            senderType: "user",
            message,
            metadata: null,
            createdBy: userId,
        });
        const historyRecords = await chat_repository_js_1.chatRepository.findMessagesByConsultation(consultationId, organizationId);
        const conversationHistory = toConversationHistory(historyRecords);
        const priorMessages = historyRecords.filter((record) => record.id !== userMessage.id);
        const lastAssistantMessage = [...priorMessages]
            .reverse()
            .find((record) => record.senderType === "assistant");
        const knownTopics = extractTopicsFromMetadata(lastAssistantMessage?.metadata ?? null) ??
            defaultDiscoveryTopics();
        const priorCoverage = evaluateCoverage(knownTopics);
        const knownTopicsSummary = summarizeKnownTopics(knownTopics);
        const questionsAsked = countQuestionsAsked(priorMessages);
        const maxClarificationQuestions = env_js_1.config.DISCOVERY_MAX_CLARIFICATION_QUESTIONS;
        const coverageStatus = summarizeCoverageStatus(knownTopics, priorCoverage, questionsAsked, maxClarificationQuestions);
        let aiResponse;
        try {
            aiResponse = await ai_orchestrator_js_1.aiOrchestrator.generateConversationReply({
                organization: {
                    id: organization.id,
                    name: organization.name,
                },
                // budgetRange and timeline are deliberately not passed. They remain on the
                // consultation record as consultant-owned CRM fields, but discovery must not
                // see them: anchoring the interview on a commercial figure is what led the
                // AI to ask the client to confirm or revise it.
                consultation: {
                    id: consultation.id,
                    title: consultation.title,
                    industry: consultation.industry,
                    projectType: consultation.projectType,
                    status: consultation.status,
                },
                conversationHistory,
                userMessage: message,
                variables: {
                    knownTopicsSummary,
                    coverageStatus,
                    questionsAsked,
                    maxClarificationQuestions,
                },
            });
        }
        catch (error) {
            await chat_repository_js_1.chatRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: userMessage.id,
                provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
                model: env_js_1.config.OPENAI_DEFAULT_MODEL,
                promptType: prompt_constants_js_1.PROMPT_TYPES.CONSULTATION,
                promptVersion: PROMPT_VERSION,
                requestTokens: 0,
                responseTokens: 0,
                totalTokens: 0,
                latencyMs: 0,
                estimatedCost: "0",
                status: "failed",
                errorMessage: resolveSafeErrorMessage(error),
            });
            logger_js_1.logger.error(`Chat AI generation failed for consultation=${consultationId}`);
            if (error instanceof app_error_js_1.AppError) {
                throw error;
            }
            throw new app_error_js_1.AppError("Failed to generate AI response", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        let discoveryPayload;
        try {
            discoveryPayload = parseDiscoveryPayload(aiResponse.message.content);
        }
        catch (error) {
            await chat_repository_js_1.chatRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: userMessage.id,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.CONSULTATION,
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
                : new app_error_js_1.AppError("Failed to parse discovery response", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        // Completion is decided here from topic coverage — never from anything
        // the model claims about its own confidence.
        const coverage = evaluateCoverage(discoveryPayload.topics);
        let discoveryComplete = coverage.coverageComplete;
        const questionsAskedAfterThisTurn = questionsAsked + (discoveryComplete ? 0 : 1);
        if (!discoveryComplete && questionsAskedAfterThisTurn >= maxClarificationQuestions) {
            discoveryComplete = true;
        }
        // The model is allowed to skip asking a question only when it believes
        // discovery is done — which is exactly when our own coverage computation
        // must agree. If discoveryComplete is false but the model's reply isn't
        // phrased as an actual question, it has contradicted its own topics
        // output (as observed in testing): fall back to a deterministic question
        // about the next topic our own priority order would pick, rather than
        // showing the user a stalled non-question.
        let reply;
        if (discoveryComplete) {
            reply = DISCOVERY_COMPLETE_MESSAGE;
        }
        else if (discoveryPayload.reply.trim().endsWith("?")) {
            reply = discoveryPayload.reply;
        }
        else {
            const fallbackTopic = pickNextTopic(discoveryPayload.topics, coverage);
            reply = fallbackTopic
                ? `Can you tell me more about ${DISCOVERY_TOPIC_LABELS[fallbackTopic]} for this project?`
                : discoveryPayload.reply;
        }
        const assumptions = discoveryComplete
            ? buildFinalAssumptions(discoveryPayload.topics, discoveryPayload.assumptions)
            : discoveryPayload.assumptions;
        const { assistantMessage } = await chat_repository_js_1.chatRepository.runInTransaction(async (tx) => {
            const savedAssistantMessage = await chat_repository_js_1.chatRepository.createMessage({
                consultationId,
                organizationId,
                senderType: "assistant",
                message: reply,
                metadata: {
                    finishReason: aiResponse.metadata.finishReason ?? null,
                    requestId: aiResponse.metadata.requestId ?? null,
                    topics: discoveryPayload.topics,
                    discoveryComplete,
                    assumptions,
                    questionsAsked: questionsAskedAfterThisTurn,
                },
                createdBy: null,
            }, tx);
            await chat_repository_js_1.chatRepository.createAiGeneration({
                organizationId,
                consultationId,
                conversationMessageId: savedAssistantMessage.id,
                provider: aiResponse.metadata.provider,
                model: aiResponse.metadata.model,
                promptType: prompt_constants_js_1.PROMPT_TYPES.CONSULTATION,
                promptVersion: PROMPT_VERSION,
                requestTokens: aiResponse.usage.promptTokens,
                responseTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
                latencyMs: aiResponse.metadata.latencyMs ?? 0,
                estimatedCost: "0",
                status: "success",
                errorMessage: null,
            }, tx);
            return { assistantMessage: savedAssistantMessage };
        });
        logger_js_1.logger.info(`Chat reply generated for consultation=${consultationId} model=${aiResponse.metadata.model} discoveryComplete=${discoveryComplete} questionsAsked=${questionsAskedAfterThisTurn} groupAComplete=${coverage.groupAComplete} tier1Answered=${coverage.tier1AnsweredCount}`);
        return {
            userMessage: toChatMessageDto(userMessage),
            assistantMessage: toChatMessageDto(assistantMessage),
            usage: {
                promptTokens: aiResponse.usage.promptTokens,
                completionTokens: aiResponse.usage.completionTokens,
                totalTokens: aiResponse.usage.totalTokens,
            },
            model: aiResponse.metadata.model,
            discoveryComplete,
            topics: discoveryPayload.topics,
            assumptions,
        };
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
