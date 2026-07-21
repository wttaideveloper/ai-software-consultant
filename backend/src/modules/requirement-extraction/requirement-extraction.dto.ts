import type { StructuredRequirement } from "../../db/schema/structured-requirements.js";

export type StructuredRequirementDto = {
  id: string;
  organizationId: string;
  consultationId: string;
  structuredData: StructuredRequirement;
  version: number;
  status: "draft" | "finalized";
  generatedBy: "AI" | "USER";
  createdAt: Date;
  updatedAt: Date;
};
