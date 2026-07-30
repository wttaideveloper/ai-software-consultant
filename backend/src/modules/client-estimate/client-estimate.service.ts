import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import type { CostPreviewDto } from "../cost/cost.dto.js";
import { costSettingsService } from "../cost/cost.service.js";
import { normalizeEstimateForMode } from "../estimation/estimation.mode.js";
import {
  getConsultationModeProfile,
  TECH_STACK_POLICIES,
} from "../prompts/consultation-mode.profiles.js";
import { aiEstimationPayloadSchema } from "../estimation/estimation.validation.js";
import {
  PROMPT_TYPES,
  RESERVED_TEMPLATE_VARIABLES,
} from "../prompts/prompt.constants.js";
import {
  analyzeProject,
  buildAdditionsDirective,
  buildBaselineFromAnalysis,
  buildEnrichmentDirective,
  mergeTechStack,
  normalizeTechStack,
} from "../tech-stack/tech-stack.engine.js";
import type {
  TechStack,
  TechStackContext,
} from "../tech-stack/tech-stack.types.js";
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

/**
 * Everything the technology engine is allowed to look at, assembled from the
 * wizard's own state.
 *
 * `platformLabels` is the important one. The client's platform selection used to
 * reach pricing and nothing else, so a request that ticked "iOS App" could come
 * back recommending a web-only stack — the single worst defect in the old
 * technology flow. Explicit labels outrank text detection inside the engine, so
 * a selected platform is now guaranteed to contribute technologies.
 *
 * There is no industry field in the Client Portal, by design: the engine infers
 * it from the project idea, the requirement summary and the feature list, which
 * is why those are carried here.
 */
function buildTechStackContext(
  input: GenerateClientEstimateInput,
): TechStackContext {
  return {
    projectIdea: input.projectIdea ?? null,
    requirementSummary: input.requirementSummary ?? null,
    platformLabels: input.platforms ?? [],
    features: input.features,
  };
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
      const techStackContext = buildTechStackContext(input);

      const techStackPolicy =
        getConsultationModeProfile(input.consultationMode).techStackPolicy;

      /**
       * The baseline is computed BEFORE the AI call so it can be handed to the
       * model as an already-settled decision. That inverts the old relationship:
       * the AI no longer invents a stack, it fills the gaps in one.
       *
       * Size-tier technologies are missing at this point because effort is what
       * this very call returns — the stack is rebuilt with real hours below.
       *
       * Only for BASELINE_PLUS_AI, though. The enrichment directive ends with
       * "return an empty array if the baseline is already complete", so sending a
       * greenfield baseline to a mode that then DISCARDS it produced exactly that
       * empty array and an empty section. The other policies ask the model for the
       * technologies the work itself needs, guided by the mode's own
       * techStackDirective, with no baseline to defer to.
       */
      const techStackBaseline =
        techStackPolicy === TECH_STACK_POLICIES.BASELINE_PLUS_AI
          ? buildEnrichmentDirective(
              buildBaselineFromAnalysis(analyzeProject(techStackContext)),
            )
          : buildAdditionsDirective();

      const response = await aiOrchestrator.generateStandaloneReply({
        promptType: PROMPT_TYPES.ESTIMATION,
        consultationMode: input.consultationMode,
        conversationHistory: [],
        userMessage: buildFeaturesPrompt(input.features),
        variables: {
          [RESERVED_TEMPLATE_VARIABLES.TECH_STACK_BASELINE]: techStackBaseline,
        },
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

      // Reconciles the payload with the engagement type it was asked for — see
      // estimation.mode.ts. Shared with the admin pipeline so both apply one rule.
      const estimate = normalizeEstimateForMode(
        validated.data,
        input.consultationMode,
      );

      /**
       * How the stack is composed depends on the engagement — see
       * `techStackPolicy` in consultation-mode.profiles.ts.
       *
       * BASELINE_PLUS_AI rebuilds the baseline now that effort is known, so the
       * size-dependent infrastructure (caching, orchestration, monitoring)
       * reflects the project the AI actually sized rather than a MEDIUM guess.
       * The merge stays additive-only, so every baseline technology — and
       * therefore every selected platform — survives whatever the model returned.
       *
       * AI_ONLY skips the baseline entirely: a client who already runs a system
       * must not be handed a greenfield stack, which reads as "replace all of
       * this". `normalizeTechStack` still categorises and dedupes what the AI
       * named, so the additions render grouped exactly like a full stack does.
       *
       * NONE returns nothing at all — a support engagement is a scope of service,
       * and the surface renders that instead of a technology list.
       */
      const techStack: TechStack =
        techStackPolicy === TECH_STACK_POLICIES.NONE
          ? []
          : techStackPolicy === TECH_STACK_POLICIES.AI_ONLY
            ? normalizeTechStack(estimate.techStack ?? [])
            : mergeTechStack(
                buildBaselineFromAnalysis(
                  analyzeProject({
                    ...techStackContext,
                    estimatedHours: estimate.estimatedHours,
                    complexity: estimate.complexity,
                  }),
                ),
                estimate.techStack ?? [],
              );

      const pricing = await this.priceEstimate({
        estimatedHours: estimate.estimatedHours,
        complexity: estimate.complexity,
        platformLabels: input.platforms ?? [],
      });

      /**
       * A support engagement is quoted per month, not per project. The recurring
       * figure is the same Cost Engine applied to the AI's own monthly capacity —
       * the AI supplies hours, the rate card supplies the money, exactly as
       * everywhere else.
       */
      const monthlyPricing = estimate.maintenancePlan
        ? await this.priceEstimate({
            estimatedHours: estimate.maintenancePlan.supportHoursPerMonth,
            complexity: estimate.complexity,
            platformLabels: input.platforms ?? [],
          })
        : null;

      return {
        consultationMode: input.consultationMode,
        estimatedHours: estimate.estimatedHours,
        estimatedWeeks: estimate.estimatedWeeks,
        teamSize: estimate.teamSize,
        complexity: estimate.complexity,
        confidence: estimate.confidence,
        assumptions: estimate.assumptions,
        risks: estimate.risks,
        breakdown: estimate.breakdown,
        techStack,
        pricing,
        maintenancePlan: estimate.maintenancePlan ?? null,
        migrationPlan: estimate.migrationPlan ?? null,
        enhancementImpact: estimate.enhancementImpact ?? null,
        monthlyPricing,
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
