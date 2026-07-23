import { createHash } from "node:crypto";
import { config } from "../../config/env.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { SlidingWindowCounter } from "../../shared/rate-limit/sliding-window.js";
import { mockupStorage, type StoredImageContent } from "../../shared/storage/mockup-storage.js";
import { aiOrchestrator } from "../ai/ai.orchestrator.js";
import { openAIProvider } from "../ai/providers/openai.provider.js";
import { PROMPT_TYPES } from "../prompts/prompt.constants.js";
import {
  clientMockupsRepository,
  type ClientMockupSetRecord,
  type CreateMockupImageData,
} from "./client-mockups.repository.js";
import type { ClientMockupSetDto } from "./client-mockups.dto.js";
import {
  aiConceptScreensPayloadSchema,
  type GenerateMockupsInput,
} from "./client-mockups.validation.js";

/**
 * Shared style contract appended to every screen's prompt.
 *
 * Stated as hard negatives because image models drift toward inventing brands and
 * unreadable filler text, which would make a *concept* preview look like a real
 * design decision the client never approved.
 */
const IMAGE_STYLE_DIRECTIVE = [
  "Clean, modern SaaS application user interface mockup.",
  "Flat design, neutral and muted colour palette, generous whitespace, strong visual hierarchy.",
  "Material Design quality, crisp alignment, realistic UI components.",
  "Do NOT include any logo, brand mark, company name, or trademark.",
  "Do NOT include readable body text, lorem ipsum, or gibberish lettering — suggest text as neutral placeholder bars.",
  "No people, no photographs, no 3D renders, no drop shadows on the outer frame.",
].join(" ");

/** One batch per IP per window — the cheap first line of defence. */
const ipRateLimiter = new SlidingWindowCounter(
  60 * 60 * 1000,
  config.MOCKUP_RATE_LIMIT_PER_HOUR,
);

/**
 * A PENDING row older than this is assumed orphaned by a crashed or redeployed
 * process. There is no job runner here, so without a reclaim window a single
 * crash would wedge that consultation key on "Generating…" forever.
 */
const STALE_PENDING_MS = 10 * 60 * 1000;

export type MockupRequestContext = {
  ipAddress: string | null;
};

function resolveSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError || error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

/**
 * Duplicated from the other client-* services (CLAUDE.md Common Pitfalls #6).
 * Consolidating all six copies is a deliberate out-of-scope refactor.
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

export class ClientMockupsService {
  /**
   * Reads the current batch. Pure read — it never starts work, so a page refresh
   * (or the client's polling loop) can never trigger a generation on its own.
   */
  async getSet(consultationKey: string, requirementsHash?: string): Promise<ClientMockupSetDto> {
    if (!config.MOCKUPS_ENABLED) {
      return this.emptyDto("DISABLED");
    }

    const set = await clientMockupsRepository.findSetByConsultationKey(consultationKey);

    if (!set) {
      return this.emptyDto("NONE");
    }

    if (this.isStalePending(set)) {
      // Surface as FAILED so the UI offers a retry rather than spinning forever.
      return {
        ...this.emptyDto("FAILED"),
        regenerationsUsed: set.generationCount - 1,
      };
    }

    const images =
      set.status === "READY"
        ? await clientMockupsRepository.findImagesBySetId(set.id)
        : [];

    return {
      status: set.status,
      images: images.map((image) => ({
        id: image.id,
        screenName: image.screenName,
        description: image.description,
        imageUrl: `/api/client/mockups/images/${image.id}`,
      })),
      stale:
        requirementsHash !== undefined && set.requirementsHash !== requirementsHash,
      regenerationsUsed: set.generationCount - 1,
      regenerationsAllowed: config.MOCKUP_MAX_REGENERATIONS,
      generatedAt: set.updatedAt.toISOString(),
    };
  }

  /**
   * Starts a batch if this key does not already have one, then returns
   * immediately. Generation runs detached: images take 30-90s, far longer than a
   * sane HTTP timeout, and the DB row is the job record the client polls.
   */
  async requestGeneration(
    input: GenerateMockupsInput,
    context: MockupRequestContext,
  ): Promise<ClientMockupSetDto> {
    this.assertEnabled();

    const requirementsHash = this.hashRequirements(input);
    const existing = await clientMockupsRepository.findSetByConsultationKey(
      input.consultationKey,
    );

    // Already generated (or generating) for this key — the whole point of the
    // cache. Never re-bill on a refresh.
    if (existing && !this.isStalePending(existing)) {
      return this.getSet(input.consultationKey, requirementsHash);
    }

    await this.assertWithinBudget(context);

    const claimed =
      existing && this.isStalePending(existing)
        ? await clientMockupsRepository.reclaimSetForRegeneration({
            consultationKey: input.consultationKey,
            requirementsHash,
            // A reclaim of an orphaned row is a retry, not a user-requested
            // regenerate, so it must not be blocked by the regenerate ceiling.
            maxGenerations: Number.MAX_SAFE_INTEGER,
          })
        : await clientMockupsRepository.claimSet({
            consultationKey: input.consultationKey,
            requirementsHash,
          });

    if (!claimed) {
      // Lost the race to a concurrent request; read whatever the winner created.
      return this.getSet(input.consultationKey, requirementsHash);
    }

    this.runGenerationDetached(claimed.id, input);

    return this.getSet(input.consultationKey, requirementsHash);
  }

  /** Explicit user-requested regeneration, bounded by MOCKUP_MAX_REGENERATIONS. */
  async regenerate(
    input: GenerateMockupsInput,
    context: MockupRequestContext,
  ): Promise<ClientMockupSetDto> {
    this.assertEnabled();

    const requirementsHash = this.hashRequirements(input);
    const existing = await clientMockupsRepository.findSetByConsultationKey(
      input.consultationKey,
    );

    if (!existing) {
      return this.requestGeneration(input, context);
    }

    await this.assertWithinBudget(context);

    const reclaimed = await clientMockupsRepository.reclaimSetForRegeneration({
      consultationKey: input.consultationKey,
      requirementsHash,
      // +1 because generationCount starts at 1 for the initial batch.
      maxGenerations: config.MOCKUP_MAX_REGENERATIONS + 1,
    });

    if (!reclaimed) {
      throw new AppError(
        "You've reached the limit for regenerating concept screens.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }

    this.runGenerationDetached(reclaimed.id, input);

    return this.getSet(input.consultationKey, requirementsHash);
  }

  async getImageContent(imageId: string): Promise<StoredImageContent | null> {
    const image = await clientMockupsRepository.findImageById(imageId);

    if (!image) {
      return null;
    }

    return mockupStorage.get(image.storageKey);
  }

  // ── internals ──────────────────────────────────────────────────────────

  private assertEnabled(): void {
    if (!config.MOCKUPS_ENABLED) {
      throw new AppError(
        "Concept mockups are not enabled.",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
  }

  private emptyDto(
    status: ClientMockupSetDto["status"],
    overrides: Partial<ClientMockupSetDto> = {},
  ): ClientMockupSetDto {
    return {
      status,
      images: [],
      stale: false,
      regenerationsUsed: 0,
      regenerationsAllowed: config.MOCKUP_MAX_REGENERATIONS,
      generatedAt: null,
      ...overrides,
    };
  }

  private isStalePending(set: ClientMockupSetRecord): boolean {
    return (
      set.status === "PENDING" &&
      Date.now() - set.updatedAt.getTime() > STALE_PENDING_MS
    );
  }

  /**
   * Fingerprints exactly the inputs the screens are derived from, so an unrelated
   * edit elsewhere in the wizard does not spuriously mark a batch stale.
   */
  private hashRequirements(input: GenerateMockupsInput): string {
    const canonical = JSON.stringify({
      summary: input.requirementSummary,
      features: input.features.map((f) => `${f.name}|${f.complexity}|${f.priority}`).sort(),
      platforms: [...input.platforms].sort(),
      techStack: [...input.techStack].sort(),
    });

    return createHash("sha256").update(canonical).digest("hex");
  }

  private async assertWithinBudget(context: MockupRequestContext): Promise<void> {
    const ipKey = context.ipAddress ?? "unknown";

    if (!ipRateLimiter.tryConsume(ipKey)) {
      throw new AppError(
        "Too many concept screen requests. Please try again later.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
      );
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todaysBatches = await clientMockupsRepository.countSetsCreatedSince(since);

    if (todaysBatches >= config.MOCKUP_DAILY_BATCH_BUDGET) {
      logger.warn(
        `Concept mockup daily budget reached (${todaysBatches}/${config.MOCKUP_DAILY_BATCH_BUDGET})`,
      );
      throw new AppError(
        "Concept screens are temporarily unavailable. Please try again tomorrow.",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Fire-and-forget worker. Detached on purpose (see requestGeneration), and it
   * must never reject: an unhandled rejection here would take the process down,
   * so every failure is converted into a FAILED row the client can see.
   */
  private runGenerationDetached(setId: string, input: GenerateMockupsInput): void {
    void this.generate(setId, input).catch(async (error: unknown) => {
      const message = resolveSafeErrorMessage(error);
      logger.error(`Concept mockup generation failed: ${message}`);

      try {
        await clientMockupsRepository.markSetFailed(setId, message);
      } catch (markError) {
        logger.error(
          `Failed to mark mockup set as failed: ${resolveSafeErrorMessage(markError)}`,
        );
      }
    });
  }

  private async generate(setId: string, input: GenerateMockupsInput): Promise<void> {
    const screens = await this.planScreens(input);

    const stored: CreateMockupImageData[] = [];

    // Sequential, not Promise.all: image endpoints rate-limit aggressively, and a
    // partial batch is far better than a burst that trips a 429 and loses all of it.
    for (const [index, screen] of screens.entries()) {
      try {
        const image = await openAIProvider.generateImage({
          prompt: `${screen.imagePrompt}\n\n${IMAGE_STYLE_DIRECTIVE}`,
        });

        const put = await mockupStorage.put({
          body: image.body,
          mimeType: image.mimeType,
        });

        stored.push({
          setId,
          screenName: screen.name,
          description: screen.description,
          sortOrder: index,
          storageKey: put.storageKey,
          mimeType: put.mimeType,
        });
      } catch (error) {
        // One bad screen must not throw away the ones that already cost money.
        logger.error(
          `Concept screen "${screen.name}" failed: ${resolveSafeErrorMessage(error)}`,
        );
      }
    }

    if (stored.length === 0) {
      throw new AppError(
        "No concept screens could be generated",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    await clientMockupsRepository.runInTransaction(async (tx) => {
      // Regeneration reuses the row, so clear the previous batch's rows first.
      await clientMockupsRepository.deleteImagesBySetId(setId, tx);
      await clientMockupsRepository.createImages(stored, tx);
      await clientMockupsRepository.markSetReady(setId, tx);
    });

    logger.info(`Concept mockups ready: ${stored.length} screen(s) for set ${setId}`);
  }

  /** Stage one: a cheap text call decides *what* to draw. */
  private async planScreens(input: GenerateMockupsInput) {
    const response = await aiOrchestrator.generateStandaloneReply({
      promptType: PROMPT_TYPES.CONCEPT_SCREENS,
      conversationHistory: [],
      userMessage: [
        "REQUIREMENT SUMMARY:",
        input.requirementSummary,
        "",
        "FEATURES JSON:",
        JSON.stringify(input.features, null, 2),
        "",
        `TECHNOLOGY STACK: ${input.techStack.join(", ") || "Not specified"}`,
      ].join("\n"),
      variables: {
        screenCount: String(config.MOCKUP_SCREEN_COUNT),
        platforms: input.platforms.join(", ") || "Web",
      },
    });

    let parsed: unknown;
    try {
      parsed = extractJsonPayload(response.message.content);
    } catch {
      throw new AppError(
        "AI returned an invalid concept screen format",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const validated = aiConceptScreensPayloadSchema.safeParse(parsed);
    if (!validated.success) {
      throw new AppError(
        "AI returned incomplete concept screen data",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    // Hard cap regardless of what the model returned — each screen is billable.
    return validated.data.screens.slice(0, config.MOCKUP_SCREEN_COUNT);
  }
}

export const clientMockupsService = new ClientMockupsService();
