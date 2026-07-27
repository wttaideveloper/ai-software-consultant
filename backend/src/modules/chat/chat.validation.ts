import { z } from "zod";

export const chatParamsSchema = z.object({
  consultationId: z.string().uuid("Consultation id must be a valid UUID"),
});

export const chatBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(10000, "Message must be at most 10000 characters"),
});

export type ChatBodyInput = z.infer<typeof chatBodySchema>;

const discoveryTopicStatusSchema = z.enum([
  "complete",
  "missing",
  "not_applicable",
]);

/**
 * A topic added after assistant messages were already being persisted. Defaulted
 * rather than required so an in-flight conversation, whose stored `metadata.topics`
 * predates the key, still parses and keeps its Group A/B progress instead of being
 * reset to a blank topic map on the next turn. Removed keys (timeline, budget) need
 * no such handling — Zod strips unknown keys.
 */
const newTopicSchema = discoveryTopicStatusSchema.default("missing");

export const discoveryTopicsSchema = z.object({
  // Group A
  projectOverview: discoveryTopicStatusSchema,
  businessGoals: discoveryTopicStatusSchema,
  targetUsers: discoveryTopicStatusSchema,
  applications: discoveryTopicStatusSchema,
  coreModules: discoveryTopicStatusSchema,
  // Group B
  payment: discoveryTopicStatusSchema,
  notifications: discoveryTopicStatusSchema,
  authentication: discoveryTopicStatusSchema,
  adminPanel: discoveryTopicStatusSchema,
  integrations: discoveryTopicStatusSchema,
  reporting: discoveryTopicStatusSchema,
  search: discoveryTopicStatusSchema,
  fileUploads: discoveryTopicStatusSchema,
  locationMaps: discoveryTopicStatusSchema,
  thirdPartyApis: discoveryTopicStatusSchema,
  aiFeatures: newTopicSchema,
  // Group C — no timeline/budget here by design; see the note on DiscoveryTopics
  // in chat.dto.ts.
  deployment: discoveryTopicStatusSchema,
  security: discoveryTopicStatusSchema,
  compliance: newTopicSchema,
  performance: newTopicSchema,
  scalability: discoveryTopicStatusSchema,
  futureEnhancements: discoveryTopicStatusSchema,
});

/**
 * Note: the model is intentionally NOT asked for a discoveryComplete flag.
 * Whether discovery is complete is a coverage computation the service makes
 * from `topics` (see chat.service.ts evaluateCoverage) — never the model's
 * own self-assessment.
 */
export const aiDiscoveryPayloadSchema = z.object({
  reply: z.string().min(1),
  topics: discoveryTopicsSchema,
  assumptions: z.array(z.string().min(1)),
});

export type AiDiscoveryPayload = z.infer<typeof aiDiscoveryPayloadSchema>;
