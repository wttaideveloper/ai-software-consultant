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
 * Shared style contract appended to every screen's prompt — the second half of the
 * CONCEPT_SCREENS prompt in prompt.builder.ts. Edit the two together.
 *
 * Two requirements are load-bearing here, for different reasons.
 *
 * Legible, real English text: gpt-image-1 can render typography well, but it drifts
 * toward invented, misspelled filler when not held to it — and garbled labels are
 * exactly what makes a concept preview look unprofessional. The per-screen prompt
 * supplies the literal labels to draw; this directive enforces that they be rendered
 * as real, correctly spelled words.
 *
 * Deference to the per-screen art direction: the planner chooses a palette per project,
 * but the image model has a strong prior toward a generic blue-and-white dashboard and
 * will quietly revert to it. Restating any house palette here would guarantee that every
 * project looks identical, so this directive deliberately names NO colours of its own and
 * instead makes the art direction above binding.
 */
const IMAGE_STYLE_DIRECTIVE = [
  "Render exactly the interface described above at flagship 2026 product quality — the standard of work a top-tier design studio would present to win a client, matching the polish of Stripe, Linear, Notion, Airbnb, Apple, Figma and Vercel without copying any of their branding.",
  "The ART DIRECTION stated above is binding: use those exact hex colours, that light or dark mode, that typography character and that corner radius. Do NOT substitute your own palette, and do NOT fall back to a generic blue-and-white dashboard.",
  "Craft: a deliberate visual hierarchy with one clear focal point, generous whitespace, a consistent spacing rhythm, layered surfaces, crisp hairline borders, soft realistic multi-layer shadows, tasteful gradients or glass blur where the art direction calls for them, precise line-style icons, and a confident type scale pairing a large heading with calm supporting text.",
  "Fill every region with realistic, specific content — real list rows, real metric values, real menu items, real form fields — never empty boxes, grey placeholder rectangles, or skeleton bars.",
  "ALL text in the interface MUST be real, correctly spelled English and match the labels described above. Every heading, button, menu item, tab, and form field must read as a genuine English word or phrase (for example: Login, Sign In, Email, Password, Continue, Search, Dashboard, Settings, Notifications, Cart, Checkout, Order Summary, Payment, Profile, Save, Cancel, Back).",
  "Absolutely NO invented words, misspellings, random letters or symbols, gibberish, lorem ipsum, or placeholder text, and NEVER render text as blurred or abstract bars. If unsure of a label, use a common correct English UI term.",
  "Never produce a wireframe, a low-fidelity sketch, a dated Bootstrap or Material-2 layout, a plain unstyled form, or a generic admin template.",
  "Photographic content (food, products, interiors, destinations) is encouraged where the screen calls for it and must look like professional editorial photography. Keep people incidental and small — no close-up human faces; simple circular avatar placeholders are fine. A tasteful flat vector spot illustration inside the interface is welcome for an empty state or onboarding panel, but the screen itself must be a real interface, never an illustration.",
  "No logos, brand marks, company names, trademarks, or watermarks. No 3D renders, no cartoon styling, no abstract art, no device photography, no hands, no desk scenes, and no perspective tilt — render the screen straight on, with no drop shadow on the outer edge of the image itself.",
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
