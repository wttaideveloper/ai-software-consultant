import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import { aiDetectedFeaturesPayloadSchema } from "../feature-detection/feature-detection.validation.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import type { ClientFeaturesResponseDto } from "./client-features.dto.js";
import type { GenerateClientFeaturesInput } from "./client-features.validation.js";

/**
 * Duplicated verbatim from the admin AI-generating services (see CLAUDE.md "Common
 * Pitfalls" #6) rather than introduced as a new shared helper — consolidating it is a
 * separate, explicitly out-of-scope decision. Everything else here is genuinely
 * reused: PROMPT_TYPES.FEATURE_DETECTION is the admin module's own prompt
 * (unmodified), and aiDetectedFeaturesPayloadSchema is imported directly from
 * feature-detection.validation.ts rather than redefined.
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
 * Backs the public, unauthenticated Client Portal's Detected Features step. Same
 * prompt and same AI response contract as the admin flow, fed the client's *edited*
 * requirement summary text instead of an admin-side requirement_summaries row — the
 * edited summary is the only source of truth here, per the Client Portal spec.
 * Stateless like the rest of the Client Portal backend (see
 * client-requirements.service.ts for why).
 */
export class ClientFeaturesService {
  async generate(input: GenerateClientFeaturesInput): Promise<ClientFeaturesResponseDto> {
    try {
      const response = await aiOrchestrator.generateStandaloneReply({
        promptType: PROMPT_TYPES.FEATURE_DETECTION,
        consultationMode: input.consultationMode,
        conversationHistory: [],
        userMessage: input.summary,
      });

      let parsed: unknown;
      try {
        parsed = extractJsonPayload(response.message.content);
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

      return {
        features: validated.data.features.map((feature) => ({
          name: feature.name,
          category: feature.category,
          description: feature.description,
          priority: feature.priority,
          complexity: feature.complexity,
        })),
      };
    } catch (error) {
      logger.error(`Client feature detection failed: ${resolveSafeErrorMessage(error)}`);
      throw error instanceof AppError
        ? error
        : new AppError("Failed to detect features", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

export const clientFeaturesService = new ClientFeaturesService();
