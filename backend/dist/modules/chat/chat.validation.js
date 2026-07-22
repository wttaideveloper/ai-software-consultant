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
exports.aiDiscoveryPayloadSchema = zod_1.z.object({
    reply: zod_1.z.string().min(1),
    topics: exports.discoveryTopicsSchema,
    assumptions: zod_1.z.array(zod_1.z.string().min(1)),
});
