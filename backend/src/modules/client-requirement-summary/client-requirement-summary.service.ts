import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import { aiRequirementSummaryPayloadSchema } from "../requirement-summary/requirement-summary.validation.js";
import type { ClientRequirementSummaryDto } from "./client-requirement-summary.dto.js";
import type { GenerateClientSummaryInput } from "./client-requirement-summary.validation.js";

/**
 * Duplicated verbatim from the admin AI-generating services (see CLAUDE.md "Common
 * Pitfalls" #6) rather than introduced as a new shared helper — consolidating it is a
 * separate, explicitly out-of-scope decision. Everything else here is genuinely
 * reused, not reimplemented: PROMPT_TYPES.REQUIREMENT_SUMMARY is the admin module's
 * own prompt (unmodified), and aiRequirementSummaryPayloadSchema is imported directly
 * from requirement-summary.validation.ts rather than redefined.
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

/**
 * The admin service builds this same kind of transcript from `conversation_messages`
 * DB rows (see requirement-summary.service.ts's buildConversationTranscript); this is
 * the equivalent for the Client Portal's in-memory discovery turns, which have no DB
 * row to read from.
 */
function buildTranscript(input: GenerateClientSummaryInput): string {
  const platforms = input.otherPlatform?.trim()
    ? [...input.platforms, input.otherPlatform.trim()]
    : input.platforms;

  const lines = [
    `Project idea: ${input.projectIdea}`,
    `Target platforms: ${platforms.join(", ")}`,
    "",
    "Discovery interview:",
    ...input.conversation.map((turn) =>
      turn.role === "assistant" ? `Q: ${turn.content}` : `A: ${turn.content}`,
    ),
  ];

  return lines.join("\n");
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

/**
 * Backs the public, unauthenticated Client Portal's Requirement Summary step. Same
 * prompt and same AI response contract as the admin flow, fed a Client Discovery
 * transcript instead of admin_chat conversation_messages. Stateless like the rest of
 * the Client Portal backend — see client-requirements.service.ts for why (no
 * organization/consultation to persist against or audit an ai_generations row on).
 */
export class ClientRequirementSummaryService {
  async generate(input: GenerateClientSummaryInput): Promise<ClientRequirementSummaryDto> {
    try {
      const response = await aiOrchestrator.generateStandaloneReply({
        promptType: PROMPT_TYPES.REQUIREMENT_SUMMARY,
        conversationHistory: [],
        userMessage: buildTranscript(input),
        variables: {
          consultationTitle: input.projectIdea.slice(0, 80),
        },
      });

      let parsed: unknown;
      try {
        parsed = extractJsonPayload(response.message.content);
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

      return {
        summaryMarkdown: validated.data.summaryMarkdown,
        structuredSummary: validated.data.structuredSummary,
      };
    } catch (error) {
      logger.error(`Client requirement summary generation failed: ${resolveSafeErrorMessage(error)}`);
      throw error instanceof AppError
        ? error
        : new AppError(
            "Failed to generate the requirement summary",
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
    }
  }
}

export const clientRequirementSummaryService = new ClientRequirementSummaryService();
