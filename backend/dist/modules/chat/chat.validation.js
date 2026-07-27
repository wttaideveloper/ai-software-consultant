"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiDiscoveryPayloadSchema = exports.discoveryTopicsSchema = exports.chatBodySchema = exports.chatParamsSchema = void 0;
const zod_1 = require("zod");
exports.chatParamsSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid("Consultation id must be a valid UUID"),
});
exports.chatBodySchema = zod_1.z.object({
    message: zod_1.z
        .string()
        .trim()
        .min(1, "Message is required")
        .max(10000, "Message must be at most 10000 characters"),
});
const discoveryTopicStatusSchema = zod_1.z.enum([
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
exports.discoveryTopicsSchema = zod_1.z.object({
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
exports.aiDiscoveryPayloadSchema = zod_1.z.object({
    reply: zod_1.z.string().min(1),
    topics: exports.discoveryTopicsSchema,
    assumptions: zod_1.z.array(zod_1.z.string().min(1)),
});
