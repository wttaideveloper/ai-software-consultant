import type { StructuredRequirementSummary } from "../../db/schema/requirement-summaries.js";

export type ClientRequirementSummaryDto = {
  summaryMarkdown: string;
  structuredSummary: StructuredRequirementSummary;
};
