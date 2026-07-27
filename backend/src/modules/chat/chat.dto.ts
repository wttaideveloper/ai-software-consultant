export type ChatMessageDto = {
  id: string;
  consultationId: string;
  organizationId: string;
  senderType: "user" | "assistant" | "system";
  message: string;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: Date;
};

export type ChatUsageDto = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type DiscoveryTopicStatus = "complete" | "missing" | "not_applicable";

export type DiscoveryTopics = {
  // Group A — mandatory, all must be "complete" before discovery can finish.
  projectOverview: DiscoveryTopicStatus;
  businessGoals: DiscoveryTopicStatus;
  targetUsers: DiscoveryTopicStatus;
  applications: DiscoveryTopicStatus;
  coreModules: DiscoveryTopicStatus;
  // Group B, Tier 1 — business-critical; counts toward the completion
  // threshold (at least 2 must be "complete" or "not_applicable").
  payment: DiscoveryTopicStatus;
  authentication: DiscoveryTopicStatus;
  adminPanel: DiscoveryTopicStatus;
  notifications: DiscoveryTopicStatus;
  integrations: DiscoveryTopicStatus;
  // Group B, Tier 2 — optional; never counts toward completion by itself.
  reporting: DiscoveryTopicStatus;
  search: DiscoveryTopicStatus;
  fileUploads: DiscoveryTopicStatus;
  locationMaps: DiscoveryTopicStatus;
  thirdPartyApis: DiscoveryTopicStatus;
  aiFeatures: DiscoveryTopicStatus;
  // Group C — optional; never blocks completion, missing ones become assumptions.
  //
  // Timeline and Budget were deliberately removed from this set: the client is
  // never asked how long the project should take or what it should cost. Those
  // are commercial decisions the consultancy makes afterwards, and the system
  // derives them from the requirements (estimation.service.ts for effort,
  // cost.engine.ts for price). Do not reintroduce them as discovery topics —
  // a topic here is, by definition, something the AI is allowed to ask about.
  deployment: DiscoveryTopicStatus;
  security: DiscoveryTopicStatus;
  compliance: DiscoveryTopicStatus;
  performance: DiscoveryTopicStatus;
  scalability: DiscoveryTopicStatus;
  futureEnhancements: DiscoveryTopicStatus;
};

export type ChatResponseDto = {
  userMessage: ChatMessageDto;
  assistantMessage: ChatMessageDto;
  usage: ChatUsageDto;
  model: string;
  discoveryComplete: boolean;
  topics: DiscoveryTopics;
  assumptions: string[];
};
