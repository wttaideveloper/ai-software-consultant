import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import {
  CONSULTATION_TIME_QUESTION_LIMITS,
  DEFAULT_QUESTION_LIMIT,
  MAX_QUESTIONS_HARD_CAP,
} from "./client-requirements.constants.js";
import type { ClientDiscoveryQuestionDto } from "./client-requirements.dto.js";
import {
  aiDiscoveryPayloadSchema,
  type NextClientDiscoveryInput,
  type StartClientDiscoveryInput,
} from "./client-requirements.validation.js";

/**
 * Duplicated verbatim from the five admin AI-generating services (see CLAUDE.md
 * "Common Pitfalls" #6) rather than introduced as a new shared helper — that
 * consolidation is a separate, explicitly out-of-scope decision.
 */
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

function buildPlatformsSummary(platforms: string[], otherPlatform?: string): string {
  const items = otherPlatform?.trim() ? [...platforms, otherPlatform.trim()] : platforms;
  return items.join(", ");
}

function buildContextVariables(
  input: {
    projectIdea: string;
    consultationTime: string;
    platforms: string[];
    otherPlatform?: string;
  },
  questionsAskedSoFar: number,
): Record<string, string | number> {
  const limit = CONSULTATION_TIME_QUESTION_LIMITS[input.consultationTime] ?? DEFAULT_QUESTION_LIMIT;

  return {
    projectIdea: input.projectIdea,
    consultationTime: input.consultationTime,
    platforms: buildPlatformsSummary(input.platforms, input.otherPlatform),
    questionGuidance: limit.guidance,
    maxQuestions: limit.maxQuestions,
    questionsAskedSoFar,
  };
}

/**
 * Collapses the Q/A history into a single text transcript rather than replaying it as
 * native multi-turn history. Feeding the model's own prior *question text* back as an
 * "assistant" turn (instead of the JSON it actually produced) makes it imitate that
 * plain-text turn on the next reply instead of following the system prompt's JSON
 * instruction — the same transcript-collapsing approach requirement-summary.service.ts
 * already uses for a similar reason.
 */
function buildTranscript(
  conversation: NextClientDiscoveryInput["conversation"],
  currentAnswer: string,
): string {
  const lines = conversation.map((turn) =>
    turn.role === "assistant" ? `Q: ${turn.content}` : `A: ${turn.content}`,
  );
  lines.push(`A: ${currentAnswer}`);

  return `Discovery interview so far:\n\n${lines.join("\n")}\n\nAsk the next question, or mark the interview complete if enough information has been gathered.`;
}

function parseDiscoveryResponse(content: string): ClientDiscoveryQuestionDto {
  let parsed: unknown;

  try {
    parsed = extractJsonPayload(content);
  } catch {
    throw new AppError(
      "AI returned an invalid discovery response format",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  const validated = aiDiscoveryPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      "AI returned an incomplete discovery response",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return {
    completed: validated.data.completed,
    question: validated.data.completed ? null : validated.data.question,
  };
}

/**
 * Backs the public, unauthenticated Client Portal discovery interview. Deliberately
 * stateless — there's no authenticated visitor, organization, or consultation record
 * to key server-side state or an ai_generations audit row on (both are NOT NULL FKs
 * to organizations/consultations), so the full conversation is round-tripped by the
 * caller on every request instead of persisted here.
 */
export class ClientRequirementsService {
  async startDiscovery(input: StartClientDiscoveryInput): Promise<ClientDiscoveryQuestionDto> {
    try {
      const response = await aiOrchestrator.generateStandaloneReply({
        promptType: PROMPT_TYPES.CLIENT_REQUIREMENT_DISCOVERY,
        conversationHistory: [],
        userMessage: "Begin the discovery interview. Ask your first question now.",
        variables: buildContextVariables(input, 0),
      });

      return parseDiscoveryResponse(response.message.content);
    } catch (error) {
      logger.error(`Client discovery start failed: ${resolveSafeErrorMessage(error)}`);
      throw error instanceof AppError
        ? error
        : new AppError("Failed to start the discovery interview", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  async nextQuestion(input: NextClientDiscoveryInput): Promise<ClientDiscoveryQuestionDto> {
    const questionsAsked = input.conversation.filter((turn) => turn.role === "assistant").length;

    if (questionsAsked >= MAX_QUESTIONS_HARD_CAP) {
      return { question: null, completed: true };
    }

    try {
      const response = await aiOrchestrator.generateStandaloneReply({
        promptType: PROMPT_TYPES.CLIENT_REQUIREMENT_DISCOVERY,
        conversationHistory: [],
        userMessage: buildTranscript(input.conversation, input.currentAnswer),
        variables: buildContextVariables(input, questionsAsked),
      });

      return parseDiscoveryResponse(response.message.content);
    } catch (error) {
      logger.error(`Client discovery next-question failed: ${resolveSafeErrorMessage(error)}`);
      throw error instanceof AppError
        ? error
        : new AppError("Failed to generate the next question", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

function resolveSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export const clientRequirementsService = new ClientRequirementsService();
