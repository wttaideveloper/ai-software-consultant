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
  // Group C
  timeline: discoveryTopicStatusSchema,
  budget: discoveryTopicStatusSchema,
  deployment: discoveryTopicStatusSchema,
  security: discoveryTopicStatusSchema,
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
