import type { AIProviderName, AIRole } from "./ai.constants.js";

export type AIModel = {
  provider: AIProviderName;
  name: string;
  maxTokens?: number;
  temperature?: number;
};

export type AIMessage = {
  role: AIRole;
  content: string;
  name?: string;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type GenerationMetadata = {
  provider: AIProviderName;
  model: string;
  finishReason?: string;
  latencyMs?: number;
  requestId?: string;
};

export type AIRequest = {
  model: AIModel;
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
};

export type AIResponse = {
  message: AIMessage;
  usage: TokenUsage;
  metadata: GenerationMetadata;
};

export interface AIProvider {
  readonly name: AIProviderName;
  generateResponse(request: AIRequest): Promise<AIResponse>;
}

export type AIImageRequest = {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
};

export type AIImageResult = {
  /** Raw bytes, already base64-decoded. Providers return base64, never a durable URL. */
  body: Buffer;
  mimeType: string;
  metadata: GenerationMetadata;
};

/**
 * Image generation is a **separate** capability from text, not extra methods on
 * AIProvider: a provider that only does chat completions must stay a valid
 * AIProvider. Anything that needs pictures depends on this interface instead, so
 * the dependency is explicit and a text-only provider can never be passed in by
 * mistake.
 */
export interface AIImageProvider {
  readonly name: AIProviderName;
  generateImage(request: AIImageRequest): Promise<AIImageResult>;
}

export type AITranscriptionRequest = {
  /** Raw audio bytes. Held in memory only — never written to disk by any caller. */
  body: Buffer;
  /** Original upload name; the provider needs an extension to sniff the container. */
  filename: string;
  mimeType: string;
  model?: string;
  /** BCP-47 hint. Omitted means the provider auto-detects. */
  language?: string;
  /** Per-call override — audio is slower than text and gets its own budget. */
  timeoutMs?: number;
};

export type AITranscriptionResult = {
  text: string;
  metadata: GenerationMetadata;
};

/**
 * Speech-to-text is a **third, separate** capability, for the same reason images
 * are (see AIImageProvider): a provider that only does chat completions must stay
 * a valid AIProvider. Bytes in, text out — the port deliberately knows nothing
 * about HTTP uploads or files on disk, so no adapter can be tempted to persist
 * the audio.
 */
export interface AITranscriptionProvider {
  readonly name: AIProviderName;
  transcribeAudio(request: AITranscriptionRequest): Promise<AITranscriptionResult>;
}
