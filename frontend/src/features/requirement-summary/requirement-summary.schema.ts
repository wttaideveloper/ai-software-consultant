import { z } from "zod";
import type { RequirementSummary, StructuredRequirementSummary, UpdateRequirementSummaryPayload } from "@/types";

export const requirementSummaryEditSchema = z.object({
  summaryMarkdown: z.string().trim().min(1, "Summary cannot be empty"),
  projectName: z.string().trim().min(1, "Required"),
  projectType: z.string().trim().min(1, "Required"),
  businessGoals: z.string(),
  targetUsers: z.string(),
  coreFeatures: z.string(),
  adminFeatures: z.string(),
  integrations: z.string(),
  nonFunctionalRequirements: z.string(),
  assumptions: z.string(),
  openQuestions: z.string(),
});

export type RequirementSummaryEditValues = z.infer<typeof requirementSummaryEditSchema>;

export const EMPTY_EDIT_VALUES: RequirementSummaryEditValues = {
  summaryMarkdown: "",
  projectName: "",
  projectType: "",
  businessGoals: "",
  targetUsers: "",
  coreFeatures: "",
  adminFeatures: "",
  integrations: "",
  nonFunctionalRequirements: "",
  assumptions: "",
  openQuestions: "",
};

export const ARRAY_FIELDS: Array<{ key: keyof StructuredRequirementSummary; label: string }> = [
  { key: "businessGoals", label: "Business Goals" },
  { key: "targetUsers", label: "Target Users" },
  { key: "coreFeatures", label: "Core Features" },
  { key: "adminFeatures", label: "Admin Features" },
  { key: "integrations", label: "Integrations" },
  { key: "nonFunctionalRequirements", label: "Non-Functional Requirements" },
  { key: "assumptions", label: "Assumptions" },
  { key: "openQuestions", label: "Open Questions" },
];

function toLines(items: string[]): string {
  return items.join("\n");
}

function toItems(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function summaryToFormValues(summary: RequirementSummary): RequirementSummaryEditValues {
  const structured = summary.structuredSummary;
  return {
    summaryMarkdown: summary.summary,
    projectName: structured.projectName,
    projectType: structured.projectType,
    businessGoals: toLines(structured.businessGoals),
    targetUsers: toLines(structured.targetUsers),
    coreFeatures: toLines(structured.coreFeatures),
    adminFeatures: toLines(structured.adminFeatures),
    integrations: toLines(structured.integrations),
    nonFunctionalRequirements: toLines(structured.nonFunctionalRequirements),
    assumptions: toLines(structured.assumptions),
    openQuestions: toLines(structured.openQuestions),
  };
}

export function formValuesToPayload(
  values: RequirementSummaryEditValues,
): UpdateRequirementSummaryPayload {
  return {
    summaryMarkdown: values.summaryMarkdown,
    structuredSummary: {
      projectName: values.projectName,
      projectType: values.projectType,
      businessGoals: toItems(values.businessGoals),
      targetUsers: toItems(values.targetUsers),
      coreFeatures: toItems(values.coreFeatures),
      adminFeatures: toItems(values.adminFeatures),
      integrations: toItems(values.integrations),
      nonFunctionalRequirements: toItems(values.nonFunctionalRequirements),
      assumptions: toItems(values.assumptions),
      openQuestions: toItems(values.openQuestions),
    },
  };
}
