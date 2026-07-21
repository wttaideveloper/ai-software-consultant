import { config } from "../../config/env.js";
import { logger } from "../../shared/logger/logger.js";
import {
  PROMPT_TYPES,
  type PromptType,
} from "../prompts/prompt.constants.js";
import { PromptService, promptService } from "../prompts/prompt.service.js";
import type {
  ConsultationPromptContext,
  ConversationPromptMessage,
  OrganizationPromptContext,
  TemplateVariables,
} from "../prompts/prompt.types.js";
import { AI_PROVIDERS } from "./ai.constants.js";
import { AIService } from "./ai.service.js";
import type { AIModel, AIRequest, AIResponse } from "./ai.types.js";
import { openAIProvider } from "./providers/openai.provider.js";

export type GenerateConversationReplyInput = {
  organization: OrganizationPromptContext;
  consultation: ConsultationPromptContext;
  conversationHistory: ConversationPromptMessage[];
  userMessage: string;
  promptType?: PromptType;
  model?: AIModel;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
  variables?: TemplateVariables;
};

export class AIOrchestrator {
  constructor(
    private readonly promptService: PromptService,
    private readonly aiService: AIService,
  ) {}

  async generateConversationReply(
    input: GenerateConversationReplyInput,
  ): Promise<AIResponse> {
    await this.beforeGenerate(input);

    const request = this.buildRequest(input);
    const preparedRequest = await this.applyPreGenerationHooks(request, input);
    const response = await this.aiService.generateResponse(preparedRequest);
    const finalizedResponse = await this.applyPostGenerationHooks(
      preparedRequest,
      response,
      input,
    );

    return finalizedResponse;
  }

  private buildRequest(input: GenerateConversationReplyInput): AIRequest {
    const model: AIModel = input.model ?? {
      provider: AI_PROVIDERS.OPENAI,
      name: config.OPENAI_DEFAULT_MODEL,
    };

    return this.promptService.buildAIRequest({
      promptType: input.promptType ?? PROMPT_TYPES.CONSULTATION,
      model,
      userMessage: input.userMessage,
      organization: input.organization,
      consultation: input.consultation,
      conversationHistory: input.conversationHistory,
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      variables: input.variables,
      metadata: {
        consultationId: input.consultation.id,
        organizationId: input.organization.id,
        promptType: input.promptType ?? PROMPT_TYPES.CONSULTATION,
        ...input.metadata,
      },
    });
  }

  protected async beforeGenerate(
    _input: GenerateConversationReplyInput,
  ): Promise<void> {
    // Extension point: moderation, rate limiting, authz checks
  }

  protected async applyPreGenerationHooks(
    request: AIRequest,
    _input: GenerateConversationReplyInput,
  ): Promise<AIRequest> {
    // Extension point: guardrails, prompt rewriting, provider selection
    return request;
  }

  protected async applyPostGenerationHooks(
    request: AIRequest,
    response: AIResponse,
    input: GenerateConversationReplyInput,
  ): Promise<AIResponse> {
    // Extension point: persistence, observability, retries side-effects
    logger.debug(
      `AIOrchestrator reply generated for consultation=${input.consultation.id} provider=${response.metadata.provider} model=${response.metadata.model}`,
    );

    void request;
    return response;
  }
}

export function createAIOrchestrator(
  promptServiceInstance: PromptService,
  aiServiceInstance: AIService,
): AIOrchestrator {
  return new AIOrchestrator(promptServiceInstance, aiServiceInstance);
}

export const aiOrchestrator = createAIOrchestrator(
  promptService,
  new AIService(openAIProvider),
);
