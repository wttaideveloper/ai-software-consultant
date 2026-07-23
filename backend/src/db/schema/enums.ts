import { pgEnum } from "drizzle-orm/pg-core";

export const verificationTokenTypeEnum = pgEnum("verification_token_type", [
  "EMAIL_VERIFY",
  "PASSWORD_RESET",
  "INVITATION",
]);

export const messageSenderTypeEnum = pgEnum("message_sender_type", [
  "user",
  "assistant",
  "system",
]);

export const aiGenerationStatusEnum = pgEnum("ai_generation_status", [
  "success",
  "failed",
]);

export const requirementSummaryStatusEnum = pgEnum(
  "requirement_summary_status",
  ["draft", "finalized"],
);

export const requirementSummaryGeneratedByEnum = pgEnum(
  "requirement_summary_generated_by",
  ["AI", "USER"],
);

export const featurePriorityEnum = pgEnum("feature_priority", [
  "HIGH",
  "MEDIUM",
  "LOW",
]);

export const featureComplexityEnum = pgEnum("feature_complexity", [
  "LOW",
  "MEDIUM",
  "HIGH",
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
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
export const leadProposalStatusEnum = pgEnum("lead_proposal_status", [
  "DRAFT",
  "READY",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "ARCHIVED",
]);

export const clientLeadStatusEnum = pgEnum("client_lead_status", [
  "NEW",
  "CONTACTED",
  "CONVERTED",
  "CLOSED",
]);

export const clientPreferredContactMethodEnum = pgEnum(
  "client_preferred_contact_method",
  ["EMAIL", "PHONE", "WHATSAPP"],
);
