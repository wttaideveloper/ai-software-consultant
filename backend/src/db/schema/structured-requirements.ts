import {
  index,
  integer,
  jsonb,
  pgTable,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { consultations } from "./consultations.js";
import {
  requirementSummaryGeneratedByEnum,
  requirementSummaryStatusEnum,
} from "./enums.js";
import { createdAt, deletedAt, updatedAt } from "./helpers.js";
import { organizations } from "./organizations.js";

export type RequirementFeature = {
  name: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export type StructuredRequirement = {
  project: {
    name: string;
    type: string;
    industry: string | null;
    summary: string;
  };
  businessGoals: string[];
  applications: Array<{
    name: string;
    platform: "web" | "ios" | "android" | "desktop" | "api";
    description: string;
  }>;
  targetUsers: Array<{
    name: string;
    description: string;
  }>;
  actors: Array<{
    name: string;
    responsibilities: string[];
  }>;
  modules: Array<{
    name: string;
    description: string;
    features: string[];
  }>;
  customerFeatures: RequirementFeature[];
  sellerFeatures: RequirementFeature[];
  adminFeatures: RequirementFeature[];
  integrations: Array<{
    name: string;
    purpose: string;
    required: boolean;
  }>;
  payment: {
    methods: string[];
    providers: string[];
    notes: string;
  };
  notifications: {
    channels: string[];
    triggers: string[];
  };
  security: {
    authMethods: string[];
    complianceRequirements: string[];
    notes: string;
  };
  scalability: {
    expectedLoad: string | null;
    notes: string;
  };
  deployment: {
    targetEnvironment: string[];
    ciCdRequirements: string[];
    notes: string;
  };
  technicalRequirements: string[];
  businessRules: string[];
  assumptions: string[];
  risks: string[];
  futureScope: string[];
  openQuestions: string[];
};

export const structuredRequirements = pgTable(
  "structured_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id, { onDelete: "cascade" }),
    structuredData: jsonb("structured_data")
      .$type<StructuredRequirement>()
      .notNull(),
    version: integer("version").notNull().default(1),
    status: requirementSummaryStatusEnum("status").notNull().default("draft"),
    generatedBy: requirementSummaryGeneratedByEnum("generated_by")
      .notNull()
      .default("AI"),
    createdAt,
    updatedAt,
    deletedAt,
  },
  (table) => [
    uniqueIndex("structured_requirements_consultation_id_uidx").on(
      table.consultationId,
    ),
    index("structured_requirements_organization_id_idx").on(
      table.organizationId,
    ),
  ],
);
