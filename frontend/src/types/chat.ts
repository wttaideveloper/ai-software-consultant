export type MessageSenderType = "user" | "assistant" | "system";

export type ConversationMessage = {
  id: string;
  consultationId: string;
  organizationId: string;
  senderType: MessageSenderType;
  message: string;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: string;
};

export type ChatUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type ChatResponse = {
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
  usage: ChatUsage;
  model: string;
};
