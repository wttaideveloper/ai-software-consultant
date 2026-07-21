"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiOrchestrator = exports.AIOrchestrator = void 0;
exports.createAIOrchestrator = createAIOrchestrator;
const env_js_1 = require("../../config/env.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const prompt_constants_js_1 = require("../prompts/prompt.constants.js");
const prompt_service_js_1 = require("../prompts/prompt.service.js");
const ai_constants_js_1 = require("./ai.constants.js");
const ai_service_js_1 = require("./ai.service.js");
const openai_provider_js_1 = require("./providers/openai.provider.js");
class AIOrchestrator {
    promptService;
    aiService;
    constructor(promptService, aiService) {
        this.promptService = promptService;
        this.aiService = aiService;
    }
    async generateConversationReply(input) {
        await this.beforeGenerate(input);
        const request = this.buildRequest(input);
        const preparedRequest = await this.applyPreGenerationHooks(request, input);
        const response = await this.aiService.generateResponse(preparedRequest);
        const finalizedResponse = await this.applyPostGenerationHooks(preparedRequest, response, input);
        return finalizedResponse;
    }
    buildRequest(input) {
        const model = input.model ?? {
            provider: ai_constants_js_1.AI_PROVIDERS.OPENAI,
            name: env_js_1.config.OPENAI_DEFAULT_MODEL,
        };
        return this.promptService.buildAIRequest({
            promptType: input.promptType ?? prompt_constants_js_1.PROMPT_TYPES.CONSULTATION,
            model,
            userMessage: input.userMessage,
            organization: input.organization,
            consultation: input.consultation,
            conversationHistory: input.conversationHistory,
            maxTokens: input.maxTokens,
            temperature: input.temperature,
            metadata: {
                consultationId: input.consultation.id,
                organizationId: input.organization.id,
                promptType: input.promptType ?? prompt_constants_js_1.PROMPT_TYPES.CONSULTATION,
                ...input.metadata,
            },
        });
    }
    async beforeGenerate(_input) {
        // Extension point: moderation, rate limiting, authz checks
    }
    async applyPreGenerationHooks(request, _input) {
        // Extension point: guardrails, prompt rewriting, provider selection
        return request;
    }
    async applyPostGenerationHooks(request, response, input) {
        // Extension point: persistence, observability, retries side-effects
        logger_js_1.logger.debug(`AIOrchestrator reply generated for consultation=${input.consultation.id} provider=${response.metadata.provider} model=${response.metadata.model}`);
        void request;
        return response;
    }
}
exports.AIOrchestrator = AIOrchestrator;
function createAIOrchestrator(promptServiceInstance, aiServiceInstance) {
    return new AIOrchestrator(promptServiceInstance, aiServiceInstance);
}
exports.aiOrchestrator = createAIOrchestrator(prompt_service_js_1.promptService, new ai_service_js_1.AIService(openai_provider_js_1.openAIProvider));
