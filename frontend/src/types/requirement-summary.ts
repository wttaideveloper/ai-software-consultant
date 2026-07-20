import type { ConsultationStatus } from "./consultation";

export type StructuredRequirementSummary = {
  projectName: string;
  projectType: string;
  businessGoals: string[];
  targetUsers: string[];
  coreFeatures: string[];
  adminFeatures: string[];
  integrations: string[];
  nonFunctionalRequirements: string[];
  assumptions: string[];
  openQuestions: string[];
};

export type RequirementSummaryStatus = "draft" | "finalized";
export type RequirementSummaryGeneratedBy = "AI" | "USER";

export type RequirementSummaryConsultation = {
  id: string;
  title: string;
  status: ConsultationStatus;
  industry: string | null;
  projectType: string | null;
  budgetRange: string | null;
  timeline: string | null;
};

export type RequirementSummary = {
  consultation: RequirementSummaryConsultation;
  summary: string;
  structuredSummary: StructuredRequirementSummary;
  version: number;
  status: RequirementSummaryStatus;
  generatedBy: RequirementSummaryGeneratedBy;
  updatedAt: string;
};

export type UpdateRequirementSummaryPayload = {
  summaryMarkdown?: string;
  structuredSummary?: StructuredRequirementSummary;
  status?: RequirementSummaryStatus;
};
