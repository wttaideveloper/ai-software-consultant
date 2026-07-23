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

/**
 * Cost engine enumerations.
 *
 * `cost_complexity_level` has four members and is deliberately NOT
 * `feature_complexity` (LOW/MEDIUM/HIGH): pricing tiers and the AI's complexity
 * signal are different vocabularies, and ENTERPRISE has no AI counterpart. The
 * mapping between them lives in cost.constants.ts.
 */
export const costRoleEnum = pgEnum("cost_role", [
  "FRONTEND",
  "BACKEND",
  "UI_UX_DESIGN",
  "QA_TESTING",
  "DEVOPS",
  "PROJECT_MANAGEMENT",
  "AI_DEVELOPMENT",
]);

export const costComplexityLevelEnum = pgEnum("cost_complexity_level", [
  "SIMPLE",
  "MEDIUM",
  "COMPLEX",
  "ENTERPRISE",
]);

export const costPlatformEnum = pgEnum("cost_platform", [
  "WEB",
  "ANDROID",
  "IOS",
  "DESKTOP",
  "ADMIN_PANEL",
  "API",
  "AI_INTEGRATION",
]);

export const costCurrencyEnum = pgEnum("cost_currency", [
  "INR",
  "USD",
  "EUR",
  "GBP",
]);

export const costTaxTypeEnum = pgEnum("cost_tax_type", [
  "GST",
  "VAT",
  "SERVICE_TAX",
]);

export const costDiscountTypeEnum = pgEnum("cost_discount_type", [
  "PERCENTAGE",
  "FIXED",
]);

export const clientPreferredContactMethodEnum = pgEnum(
  "client_preferred_contact_method",
  ["EMAIL", "PHONE", "WHATSAPP"],
);
