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
