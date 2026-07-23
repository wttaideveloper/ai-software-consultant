import type { LeadProposalContent } from "@/types";

/**
 * What the Proposal Editor binds to: one version's title plus its authored body.
 *
 * A flat shape on purpose — every field maps to one editor control, so the page
 * can `patch({ timeline })` without knowing whether a field lives in the
 * `title` column or inside `proposal_json`. splitDraft() puts it back into the
 * server's shape at the boundary.
 *
 * `status` is deliberately NOT part of the draft. It is the version's lifecycle
 * state, moved through its own endpoint with its own transition rules — saving
 * the body must never change what stage a proposal is at.
 *
 * Previously this type described a browser-local draft (`project_proposals`
 * could not hold a lead proposal without a schema change). That schema change
 * shipped: `lead_proposals` now stores these fields, so the type is derived from
 * the server contract rather than approximating it.
 */
export type LeadProposalDraft = { title: string } & LeadProposalContent;

/** Splits the editor's flat draft back into the API's `{ title, content }`. */
export function splitDraft(draft: LeadProposalDraft): {
  title: string;
  content: LeadProposalContent;
} {
  const {
    title,
    executiveSummary,
    scopeOfWork,
    deliverables,
    timeline,
    teamStructure,
    assumptions,
    risks,
    pricingNotes,
    termsAndConditions,
    features,
  } = draft;

  // Fields are listed explicitly rather than spread, so nothing extra a caller
  // happens to be carrying (e.g. a legacy localStorage `status`) reaches the API.
  return {
    title,
    content: {
      executiveSummary,
      scopeOfWork,
      deliverables,
      timeline,
      teamStructure,
      assumptions,
      risks,
      pricingNotes,
      termsAndConditions,
      features,
    },
  };
}

/** Flattens a stored version back into the editor's working shape. */
export function toDraft(
  title: string,
  content: LeadProposalContent,
): LeadProposalDraft {
  return { title, ...content };
}

/**
 * A browser-local draft from before `lead_proposals` existed.
 *
 * Retained only so migrate-local-draft.ts can find and upgrade one. Nothing
 * writes this shape any more — see proposal-draft.store.ts.
 */
export type StoredLeadProposal = {
  leadId: string;
  draft: LeadProposalDraft;
  /** ISO timestamp of the last local save; null until first saved. */
  savedAt: string | null;
};
