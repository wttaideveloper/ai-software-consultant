import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LeadProposalDraft,
  StoredLeadProposal,
} from "@/features/proposal-editor/lead-proposal.types";

/**
 * DEPRECATED — legacy read path only. Nothing writes to this store any more.
 *
 * Proposals now live in the `lead_proposals` table and are edited through
 * lead-proposals.service.ts. This store survives for exactly one reason: drafts
 * an admin saved before that table existed are still sitting in their browser,
 * and use-migrate-local-draft.ts reads them once to promote them to Version 1,
 * then calls clearDraft().
 *
 * Safe to delete — along with the `asc-proposal-drafts` localStorage key — once
 * enough time has passed that no browser can still be holding an unmigrated
 * draft. `saveDraft` is retained only so the store's shape stays intact for the
 * migration; calling it would reintroduce data nothing else reads.
 */

type ProposalDraftState = {
  /** Keyed by lead id — one draft per lead. */
  drafts: Record<string, StoredLeadProposal>;
  saveDraft: (leadId: string, draft: LeadProposalDraft) => void;
  clearDraft: (leadId: string) => void;
};

export const useProposalDraftStore = create<ProposalDraftState>()(
  persist(
    (set) => ({
      drafts: {},

      saveDraft: (leadId, draft) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [leadId]: { leadId, draft, savedAt: new Date().toISOString() },
          },
        })),

      clearDraft: (leadId) =>
        set((state) => {
          // Omit the key entirely rather than setting undefined, so a cleared
          // draft cannot be mistaken for a saved-but-empty one.
          const { [leadId]: _removed, ...rest } = state.drafts;
          return { drafts: rest };
        }),
    }),
    { name: "asc-proposal-drafts" },
  ),
);
