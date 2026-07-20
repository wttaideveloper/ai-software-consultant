export type ProposalStatus = "DRAFT" | "REVIEWED" | "APPROVED";
export type ProposalGeneratedBy = "AI" | "USER";

export type Proposal = {
  id: string;
  organizationId: string;
  consultationId: string;
  requirementSummaryId: string;
  estimationId: string;
  title: string;
  executiveSummary: string;
  scopeOfWork: string[];
  deliverables: string[];
  timeline: string;
  /** Single newline-joined string, not an array — matches the backend column. */
  assumptions: string;
  /** Single newline-joined string, not an array — matches the backend column. */
  exclusions: string;
  pricingNotes: string;
  proposalMarkdown: string;
  generatedBy: ProposalGeneratedBy;
  version: number;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProposalPayload = {
  title?: string;
  executiveSummary?: string;
  scopeOfWork?: string[];
  deliverables?: string[];
  timeline?: string;
  assumptions?: string;
  exclusions?: string;
  pricingNotes?: string;
  proposalMarkdown?: string;
  status?: ProposalStatus;
};
