"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientPreferredContactMethodEnum = exports.clientLeadStatusEnum = exports.leadProposalStatusEnum = exports.proposalStatusEnum = exports.featureComplexityEnum = exports.featurePriorityEnum = exports.requirementSummaryGeneratedByEnum = exports.requirementSummaryStatusEnum = exports.aiGenerationStatusEnum = exports.messageSenderTypeEnum = exports.verificationTokenTypeEnum = void 0;
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
exports.clientPreferredContactMethodEnum = (0, pg_core_1.pgEnum)("client_preferred_contact_method", ["EMAIL", "PHONE", "WHATSAPP"]);
