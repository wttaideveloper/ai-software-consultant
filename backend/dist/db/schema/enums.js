"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientMockupSetStatusEnum = exports.clientPreferredContactMethodEnum = exports.costDiscountTypeEnum = exports.costTaxTypeEnum = exports.costCurrencyEnum = exports.costPlatformEnum = exports.costComplexityLevelEnum = exports.costRoleEnum = exports.clientLeadStatusEnum = exports.leadProposalStatusEnum = exports.proposalStatusEnum = exports.featureComplexityEnum = exports.featurePriorityEnum = exports.requirementSummaryGeneratedByEnum = exports.requirementSummaryStatusEnum = exports.aiGenerationStatusEnum = exports.messageSenderTypeEnum = exports.verificationTokenTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.verificationTokenTypeEnum = (0, pg_core_1.pgEnum)("verification_token_type", [
    "EMAIL_VERIFY",
    "PASSWORD_RESET",
    "INVITATION",
]);
exports.messageSenderTypeEnum = (0, pg_core_1.pgEnum)("message_sender_type", [
    "user",
    "assistant",
    "system",
]);
exports.aiGenerationStatusEnum = (0, pg_core_1.pgEnum)("ai_generation_status", [
    "success",
    "failed",
]);
exports.requirementSummaryStatusEnum = (0, pg_core_1.pgEnum)("requirement_summary_status", ["draft", "finalized"]);
exports.requirementSummaryGeneratedByEnum = (0, pg_core_1.pgEnum)("requirement_summary_generated_by", ["AI", "USER"]);
exports.featurePriorityEnum = (0, pg_core_1.pgEnum)("feature_priority", [
    "HIGH",
    "MEDIUM",
    "LOW",
]);
exports.featureComplexityEnum = (0, pg_core_1.pgEnum)("feature_complexity", [
    "LOW",
    "MEDIUM",
    "HIGH",
]);
exports.proposalStatusEnum = (0, pg_core_1.pgEnum)("proposal_status", [
    "DRAFT",
    "REVIEWED",
    "APPROVED",
]);
/**
 * Lifecycle of one proposal version for a client lead.
 *
 * Deliberately a separate enum from `proposal_status` (DRAFT/REVIEWED/APPROVED),
 * which belongs to the consultation-based `project_proposals` table: the two
 * documents have different lifecycles and must be able to evolve independently.
 * It is also unrelated to `client_lead_status` — a lead's sales stage and a
 * proposal's state are independent axes and are never mixed.
 */
exports.leadProposalStatusEnum = (0, pg_core_1.pgEnum)("lead_proposal_status", [
    "DRAFT",
    "READY",
    "SENT",
    "ACCEPTED",
    "REJECTED",
    "ARCHIVED",
]);
exports.clientLeadStatusEnum = (0, pg_core_1.pgEnum)("client_lead_status", [
    "NEW",
    "CONTACTED",
    "CONVERTED",
    "CLOSED",
]);
/**
 * Cost engine enumerations.
 *
 * `cost_complexity_level` has four members and is deliberately NOT
 * `feature_complexity` (LOW/MEDIUM/HIGH): pricing tiers and the AI's complexity
 * signal are different vocabularies, and ENTERPRISE has no AI counterpart. The
 * mapping between them lives in cost.constants.ts.
 */
exports.costRoleEnum = (0, pg_core_1.pgEnum)("cost_role", [
    "FRONTEND",
    "BACKEND",
    "UI_UX_DESIGN",
    "QA_TESTING",
    "DEVOPS",
    "PROJECT_MANAGEMENT",
    "AI_DEVELOPMENT",
]);
exports.costComplexityLevelEnum = (0, pg_core_1.pgEnum)("cost_complexity_level", [
    "SIMPLE",
    "MEDIUM",
    "COMPLEX",
    "ENTERPRISE",
]);
exports.costPlatformEnum = (0, pg_core_1.pgEnum)("cost_platform", [
    "WEB",
    "ANDROID",
    "IOS",
    "DESKTOP",
    "ADMIN_PANEL",
    "API",
    "AI_INTEGRATION",
]);
exports.costCurrencyEnum = (0, pg_core_1.pgEnum)("cost_currency", [
    "INR",
    "USD",
    "EUR",
    "GBP",
]);
exports.costTaxTypeEnum = (0, pg_core_1.pgEnum)("cost_tax_type", [
    "GST",
    "VAT",
    "SERVICE_TAX",
]);
exports.costDiscountTypeEnum = (0, pg_core_1.pgEnum)("cost_discount_type", [
    "PERCENTAGE",
    "FIXED",
]);
exports.clientPreferredContactMethodEnum = (0, pg_core_1.pgEnum)("client_preferred_contact_method", ["EMAIL", "PHONE", "WHATSAPP"]);
/**
 * Lifecycle of one AI concept-mockup batch. The row itself is the job record —
 * there is no queue in this system, so PENDING doubles as "a worker is running"
 * and is reclaimed by age if the process dies mid-generation.
 */
exports.clientMockupSetStatusEnum = (0, pg_core_1.pgEnum)("client_mockup_set_status", [
    "PENDING",
    "READY",
    "FAILED",
]);
