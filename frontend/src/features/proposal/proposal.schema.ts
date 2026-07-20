import { z } from "zod";
import type { Proposal, UpdateProposalPayload } from "@/types";

export const proposalEditSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  executiveSummary: z.string().trim().min(1, "Executive summary is required"),
  /** One item per line — split into an array on submit. */
  scopeOfWork: z.string(),
  /** One item per line — split into an array on submit. */
  deliverables: z.string(),
  timeline: z.string().trim().min(1, "Timeline is required").max(255),
  assumptions: z.string().trim().min(1, "Assumptions are required"),
  exclusions: z.string().trim().min(1, "Exclusions are required"),
  pricingNotes: z.string().trim().min(1, "Pricing notes are required"),
  proposalMarkdown: z.string().trim().min(1, "Proposal document cannot be empty"),
  status: z.enum(["DRAFT", "REVIEWED", "APPROVED"]),
});

export type ProposalEditValues = z.infer<typeof proposalEditSchema>;

function toItems(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function proposalToFormValues(proposal: Proposal): ProposalEditValues {
  return {
    title: proposal.title,
    executiveSummary: proposal.executiveSummary,
    scopeOfWork: proposal.scopeOfWork.join("\n"),
    deliverables: proposal.deliverables.join("\n"),
    timeline: proposal.timeline,
    assumptions: proposal.assumptions,
    exclusions: proposal.exclusions,
    pricingNotes: proposal.pricingNotes,
    proposalMarkdown: proposal.proposalMarkdown,
    status: proposal.status,
  };
}

export function formValuesToProposalPayload(values: ProposalEditValues): UpdateProposalPayload {
  return {
    title: values.title,
    executiveSummary: values.executiveSummary,
    scopeOfWork: toItems(values.scopeOfWork),
    deliverables: toItems(values.deliverables),
    timeline: values.timeline,
    // assumptions/exclusions are single strings on the backend — passed through as-is.
    assumptions: values.assumptions,
    exclusions: values.exclusions,
    pricingNotes: values.pricingNotes,
    proposalMarkdown: values.proposalMarkdown,
    status: values.status,
  };
}
