import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import type { CostPreviewDto } from "../cost/cost.dto.js";
import { costSettingsService } from "../cost/cost.service.js";
import { aiEstimationPayloadSchema } from "../estimation/estimation.validation.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import { clientEstimateRepository } from "./client-estimate.repository.js";
import type { ClientEstimateResponseDto } from "./client-estimate.dto.js";
import type {
  GenerateClientEstimateInput,
  PriceClientEstimateInput,
} from "./client-estimate.validation.js";

/**
 * Duplicated verbatim from the admin AI-generating services (see CLAUDE.md "Common
 * Pitfalls" #6) rather than introduced as a new shared helper — consolidating it is a
 * separate, explicitly out-of-scope decision. Everything else here is genuinely
 * reused: PROMPT_TYPES.ESTIMATION is the admin module's own prompt (unmodified), and
 * aiEstimationPayloadSchema is imported directly from estimation.validation.ts rather
 * than redefined.
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

function buildFeaturesPrompt(features: GenerateClientEstimateInput["features"]): string {
  return ["DETECTED FEATURES JSON:", JSON.stringify(features, null, 2)].join("\n");
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
 * Backs the public, unauthenticated Client Portal's Estimate step. Same prompt and
 * same AI response contract as the admin flow, fed the client's *edited* feature list
 * instead of an admin-side detected_features table — no requirement summary is sent,
 * matching the explicit "Input: features" contract; the feature list (name,
 * description, priority, complexity per item) already carries enough context on its
 * own. Stateless like the rest of the Client Portal backend (see
 * client-requirements.service.ts for why).
 */
export class ClientEstimateService {
  async generate(input: GenerateClientEstimateInput): Promise<ClientEstimateResponseDto> {
    try {
      const response = await aiOrchestrator.generateStandaloneReply({
        promptType: PROMPT_TYPES.ESTIMATION,
        conversationHistory: [],
        userMessage: buildFeaturesPrompt(input.features),
      });

      let parsed: unknown;
      try {
        parsed = extractJsonPayload(response.message.content);
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

      const pricing = await this.priceEstimate({
        estimatedHours: validated.data.estimatedHours,
        complexity: validated.data.complexity,
        platformLabels: input.platforms ?? [],
      });

      return {
        estimatedHours: validated.data.estimatedHours,
        estimatedWeeks: validated.data.estimatedWeeks,
        teamSize: validated.data.teamSize,
        complexity: validated.data.complexity,
        confidence: validated.data.confidence,
        assumptions: validated.data.assumptions,
        risks: validated.data.risks,
        breakdown: validated.data.breakdown,
        techStack: validated.data.techStack ?? null,
        pricing,
      };
    } catch (error) {
      logger.error(`Client estimation failed: ${resolveSafeErrorMessage(error)}`);
      throw error instanceof AppError
        ? error
        : new AppError("Failed to generate the estimate", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Reprices an estimate for a new hour total — the endpoint behind the Client
   * Portal's live "Project Cost" recalculation when features are toggled.
   *
   * No AI is involved: the AI already ran once at generation. This only feeds the
   * updated hours (plus the unchanged complexity and platforms) back through the
   * same Cost Engine, so a toggle costs one cheap rate-card lookup, never a model
   * call. Throws when a price cannot be produced so the client keeps its last good
   * figure rather than showing a wrong one.
   */
  async price(input: PriceClientEstimateInput): Promise<CostPreviewDto> {
    const pricing = await this.priceEstimate({
      estimatedHours: input.estimatedHours,
      complexity: input.complexity,
      platformLabels: input.platforms ?? [],
    });

    if (!pricing) {
      throw new AppError(
        "Unable to calculate pricing right now",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return pricing;
  }

  /**
   * Prices the AI's effort through the Cost Management engine — the same engine
   * and org rate card the admin estimation uses (costSettingsService.priceAiEstimate),
   * never a second pricing implementation. The AI supplies effort only; the price
   * is derived here from configured rates.
   *
   * Deliberately never throws: a pricing failure (no organization provisioned yet,
   * or a misconfigured rate card) is logged and yields null so the estimate still
   * renders — the same swallow-and-null policy estimation.service.ts applies.
   */
  private async priceEstimate(input: {
    estimatedHours: number;
    complexity: "LOW" | "MEDIUM" | "HIGH";
    platformLabels: string[];
  }): Promise<CostPreviewDto | null> {
    try {
      const organizationId =
        await clientEstimateRepository.findPortalOrganizationId();

      if (!organizationId) {
        logger.error("Client estimate pricing skipped: no organization provisioned");
        return null;
      }

      return await costSettingsService.priceAiEstimate(organizationId, {
        estimatedHours: input.estimatedHours,
        complexity: input.complexity,
        platformLabels: input.platformLabels,
      });
    } catch (error) {
      logger.error(`Client estimate pricing failed: ${resolveSafeErrorMessage(error)}`);
      return null;
    }
  }
}

export const clientEstimateService = new ClientEstimateService();
