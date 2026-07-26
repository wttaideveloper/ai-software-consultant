import OpenAI, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
} from "openai";
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { config } from "../../../config/env.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { logger } from "../../../shared/logger/logger.js";
import { AI_PROVIDERS, AI_ROLES } from "../ai.constants.js";
import type {
  AIImageProvider,
  AIImageRequest,
  AIImageResult,
  AIMessage,
  AIProvider,
  AIRequest,
  AIResponse,
  AITranscriptionProvider,
  AITranscriptionRequest,
  AITranscriptionResult,
} from "../ai.types.js";
import { PROMPT_TYPES } from "../../prompts/prompt.constants.js";

function mapMessagesToOpenAI(
  request: AIRequest,
): ChatCompletionMessageParam[] {
  const hasSystemMessage = request.messages.some(
    (message) => message.role === AI_ROLES.SYSTEM,
  );

  const mappedMessages: ChatCompletionMessageParam[] = request.messages.map(
    (message) => {
      if (message.name) {
        return {
          role: message.role,
          content: message.content,
          name: message.name,
        } as ChatCompletionMessageParam;
      }

      return {
        role: message.role,
        content: message.content,
      };
    },
  );

  if (request.systemPrompt && !hasSystemMessage) {
    return [
      {
        role: AI_ROLES.SYSTEM,
        content: request.systemPrompt,
      },
      ...mappedMessages,
    ];
  }

  return mappedMessages;
}

const DISCOVERY_TOPIC_STATUS_ENUM = [
  "complete",
  "missing",
  "not_applicable",
] as const;
const DISCOVERY_TOPIC_KEYS = [
  // Group A
  "projectOverview",
  "businessGoals",
  "targetUsers",
  "applications",
  "coreModules",
  // Group B
  "payment",
  "notifications",
  "authentication",
  "adminPanel",
  "integrations",
  "reporting",
  "search",
  "fileUploads",
  "locationMaps",
  "thirdPartyApis",
  // Group C
  "timeline",
  "budget",
  "deployment",
  "security",
  "scalability",
  "futureEnhancements",
] as const;

/**
 * Mirrors chat.validation.ts's aiDiscoveryPayloadSchema (Zod) — keep both in
 * sync. Structured Outputs (json_schema + strict) guarantees the model's
 * response is not just valid JSON but matches this exact shape, which plain
 * json_object mode does not guarantee. Deliberately has no discoveryComplete
 * field — that decision is a coverage computation made in chat.service.ts,
 * never the model's own self-assessment.
 */
const DISCOVERY_RESPONSE_JSON_SCHEMA = {
  name: "discovery_response",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: { type: "string" },
      topics: {
        type: "object",
        additionalProperties: false,
        properties: Object.fromEntries(
          DISCOVERY_TOPIC_KEYS.map((key) => [
            key,
            { type: "string", enum: DISCOVERY_TOPIC_STATUS_ENUM },
          ]),
        ),
        required: [...DISCOVERY_TOPIC_KEYS],
      },
      assumptions: { type: "array", items: { type: "string" } },
    },
    required: ["reply", "topics", "assumptions"],
  },
};

function mapRequestToOpenAI(
  request: AIRequest,
): ChatCompletionCreateParamsNonStreaming {
  const modelName = request.model.name || config.OPENAI_DEFAULT_MODEL;
  const maxTokens = request.maxTokens ?? request.model.maxTokens;
  const temperature = request.temperature ?? request.model.temperature;
  // Discovery-conversation replies are a structured JSON envelope; Structured
  // Outputs guarantees the model's output matches that exact shape. Scoped
  // to CONSULTATION only so every other prompt type's request payload is
  // byte-identical to before this change.
  const isDiscoveryConversation =
    request.metadata?.["promptType"] === PROMPT_TYPES.CONSULTATION;

  return {
    model: modelName,
    messages: mapMessagesToOpenAI(request),
    ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(isDiscoveryConversation
      ? {
          response_format: {
            type: "json_schema" as const,
            json_schema: DISCOVERY_RESPONSE_JSON_SCHEMA,
          },
        }
      : {}),
  };
}

function mapOpenAIError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403) {
      return new AppError(
        "AI provider authentication failed",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (error.status === 429) {
      return new AppError(
        "AI provider rate limit exceeded",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    if (error.status === 400) {
      return new AppError(
        "AI provider rejected the request",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return new AppError(
      "AI provider request failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  if (error instanceof APIConnectionError || error instanceof APIUserAbortError) {
    return new AppError(
      "AI provider connection failed",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  return new AppError(
    "AI provider request failed",
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}

export class OpenAIProvider
  implements AIProvider, AIImageProvider, AITranscriptionProvider
{
  readonly name = AI_PROVIDERS.OPENAI;

  private readonly injectedClient: OpenAI | undefined;
  private lazyClient: OpenAI | undefined;

  constructor(client?: OpenAI) {
    if (!config.OPENAI_API_KEY) {
      logger.warn("OPENAI_API_KEY is not configured");
    }

    this.injectedClient = client;
  }

  /**
   * Constructing `OpenAI` throws synchronously if no API key is set. Doing
   * that eagerly in the constructor would crash the whole process at import
   * time (openAIProvider is a module-level singleton). Deferring it here
   * means it only ever runs once generateResponse() has already confirmed
   * config.OPENAI_API_KEY is set.
   */
  private getClient(): OpenAI {
    if (this.injectedClient) {
      return this.injectedClient;
    }

    if (!this.lazyClient) {
      this.lazyClient = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
        timeout: config.OPENAI_TIMEOUT,
      });
    }

    return this.lazyClient;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!config.OPENAI_API_KEY) {
      throw new AppError(
        "AI provider is not configured",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const startedAt = Date.now();

    try {
      const payload = mapRequestToOpenAI(request);
      const completion = await this.getClient().chat.completions.create(payload);
      const latencyMs = Date.now() - startedAt;

      const choice = completion.choices[0];
      const content = choice?.message?.content;

      if (!content) {
        throw new AppError(
          "AI provider returned an empty response",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      const assistantMessage: AIMessage = {
        role: AI_ROLES.ASSISTANT,
        content,
      };

      return {
        message: assistantMessage,
        usage: {
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
        },
        metadata: {
          provider: this.name,
          model: completion.model,
          finishReason: choice.finish_reason ?? undefined,
          latencyMs,
          requestId: completion.id,
        },
      };
    } catch (error) {
      const appError = mapOpenAIError(error);
      logger.error(
        `OpenAIProvider generateResponse failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      throw appError;
    }
  }

  /**
   * Renders one image and returns the decoded bytes.
   *
   * The image API answers with base64 (`b64_json`), and for the models that can
   * return a hosted URL that URL expires within the hour — so bytes are the only
   * thing worth handing back. Persisting a provider URL would be a guaranteed
   * broken image later, which is why this signature has no `url` at all.
   */
  async generateImage(request: AIImageRequest): Promise<AIImageResult> {
    if (!config.OPENAI_API_KEY) {
      throw new AppError(
        "AI provider is not configured",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const startedAt = Date.now();
    const model = request.model ?? config.OPENAI_IMAGE_MODEL;

    try {
      const result = await this.getClient().images.generate({
        model,
        prompt: request.prompt,
        n: 1,
        size: (request.size ?? config.OPENAI_IMAGE_SIZE) as "1024x1024",
        quality: (request.quality ?? config.OPENAI_IMAGE_QUALITY) as "low",
      });

      const encoded = result.data?.[0]?.b64_json;

      if (!encoded) {
        throw new AppError(
          "AI provider returned an empty image",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        body: Buffer.from(encoded, "base64"),
        mimeType: "image/png",
        metadata: {
          provider: this.name,
          model,
          latencyMs: Date.now() - startedAt,
        },
      };
    } catch (error) {
      const appError = mapOpenAIError(error);
      logger.error(
        `OpenAIProvider generateImage failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      throw appError;
    }
  }

  /**
   * Transcribes one recording and returns the text.
   *
   * The bytes arrive as a Buffer and are wrapped in a `File` purely to satisfy
   * the SDK's upload contract — nothing here touches the filesystem, so there is
   * no temporary file to clean up and no path that could outlive the request.
   * The buffer becomes garbage the moment this returns.
   *
   * Timeout is per-call rather than the client-wide OPENAI_TIMEOUT: a two-minute
   * recording is legitimately slower than any chat completion, and inheriting the
   * text budget would abort valid transcriptions.
   */
  async transcribeAudio(
    request: AITranscriptionRequest,
  ): Promise<AITranscriptionResult> {
    if (!config.OPENAI_API_KEY) {
      throw new AppError(
        "AI provider is not configured",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const startedAt = Date.now();
    const model = request.model ?? config.OPENAI_WHISPER_MODEL;

    try {
      const file = new File([new Uint8Array(request.body)], request.filename, {
        type: request.mimeType,
      });

      const transcription = await this.getClient().audio.transcriptions.create(
        {
          file,
          model,
          response_format: "json",
          ...(request.language ? { language: request.language } : {}),
        },
        { timeout: request.timeoutMs ?? config.OPENAI_WHISPER_TIMEOUT_MS },
      );

      // `json` yields an object with `text`; the string form only comes back for
      // the plain-text response formats. Handled so the return type is honest.
      const text =
        typeof transcription === "string" ? transcription : transcription.text;

      return {
        text: text ?? "",
        metadata: {
          provider: this.name,
          model,
          latencyMs: Date.now() - startedAt,
        },
      };
    } catch (error) {
      // Distinguished here rather than in mapOpenAIError so the shared mapping
      // (and every existing text/image call site) keeps its current messages.
      if (error instanceof APIConnectionTimeoutError) {
        logger.error("OpenAIProvider transcribeAudio timed out");
        throw new AppError(
          "Transcription took too long. Please try a shorter recording.",
          HTTP_STATUS.GATEWAY_TIMEOUT,
        );
      }

      const appError = mapOpenAIError(error);
      logger.error(
        `OpenAIProvider transcribeAudio failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      throw appError;
    }
  }
}

export const openAIProvider = new OpenAIProvider();
