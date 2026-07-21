"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAIProvider = exports.OpenAIProvider = void 0;
const openai_1 = __importStar(require("openai"));
const env_js_1 = require("../../../config/env.js");
const http_status_js_1 = require("../../../shared/constants/http-status.js");
const app_error_js_1 = require("../../../shared/errors/app-error.js");
const logger_js_1 = require("../../../shared/logger/logger.js");
const ai_constants_js_1 = require("../ai.constants.js");
function mapMessagesToOpenAI(request) {
    const hasSystemMessage = request.messages.some((message) => message.role === ai_constants_js_1.AI_ROLES.SYSTEM);
    const mappedMessages = request.messages.map((message) => {
        if (message.name) {
            return {
                role: message.role,
                content: message.content,
                name: message.name,
            };
        }
        return {
            role: message.role,
            content: message.content,
        };
    });
    if (request.systemPrompt && !hasSystemMessage) {
        return [
            {
                role: ai_constants_js_1.AI_ROLES.SYSTEM,
                content: request.systemPrompt,
            },
            ...mappedMessages,
        ];
    }
    return mappedMessages;
}
function mapRequestToOpenAI(request) {
    const modelName = request.model.name || env_js_1.config.OPENAI_DEFAULT_MODEL;
    const maxTokens = request.maxTokens ?? request.model.maxTokens;
    const temperature = request.temperature ?? request.model.temperature;
    return {
        model: modelName,
        messages: mapMessagesToOpenAI(request),
        ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
    };
}
function mapOpenAIError(error) {
    if (error instanceof app_error_js_1.AppError) {
        return error;
    }
    if (error instanceof openai_1.APIError) {
        if (error.status === 401 || error.status === 403) {
            return new app_error_js_1.AppError("AI provider authentication failed", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
        }
        if (error.status === 429) {
            return new app_error_js_1.AppError("AI provider rate limit exceeded", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        if (error.status === 400) {
            return new app_error_js_1.AppError("AI provider rejected the request", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        return new app_error_js_1.AppError("AI provider request failed", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    if (error instanceof openai_1.APIConnectionError || error instanceof openai_1.APIUserAbortError) {
        return new app_error_js_1.AppError("AI provider connection failed", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return new app_error_js_1.AppError("AI provider request failed", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
}
class OpenAIProvider {
    name = ai_constants_js_1.AI_PROVIDERS.OPENAI;
    injectedClient;
    lazyClient;
    constructor(client) {
        if (!env_js_1.config.OPENAI_API_KEY) {
            logger_js_1.logger.warn("OPENAI_API_KEY is not configured");
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
    getClient() {
        if (this.injectedClient) {
            return this.injectedClient;
        }
        if (!this.lazyClient) {
            this.lazyClient = new openai_1.default({
                apiKey: env_js_1.config.OPENAI_API_KEY,
                timeout: env_js_1.config.OPENAI_TIMEOUT,
            });
        }
        return this.lazyClient;
    }
    async generateResponse(request) {
        if (!env_js_1.config.OPENAI_API_KEY) {
            throw new app_error_js_1.AppError("AI provider is not configured", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
        const startedAt = Date.now();
        try {
            const payload = mapRequestToOpenAI(request);
            const completion = await this.getClient().chat.completions.create(payload);
            const latencyMs = Date.now() - startedAt;
            const choice = completion.choices[0];
            const content = choice?.message?.content;
            if (!content) {
                throw new app_error_js_1.AppError("AI provider returned an empty response", http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
            }
            const assistantMessage = {
                role: ai_constants_js_1.AI_ROLES.ASSISTANT,
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
        }
        catch (error) {
            const appError = mapOpenAIError(error);
            logger_js_1.logger.error(`OpenAIProvider generateResponse failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            throw appError;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
exports.openAIProvider = new OpenAIProvider();
