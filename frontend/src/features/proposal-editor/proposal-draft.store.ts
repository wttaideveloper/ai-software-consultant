import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  LeadProposalDraft,
  StoredLeadProposal,
} from "@/features/proposal-editor/lead-proposal.types";

/**
 * Local persistence for lead proposal drafts.
 *
 * ─── Why this is not a database ─────────────────────────────────────────────
 * `project_proposals` cannot hold a lead proposal without a schema change (see
 * lead-proposal.types.ts for the full reasoning). Rather than lose an admin's
 * work on every refresh, drafts are written to localStorage keyed by lead id —
 * so they survive reloads, navigation and browser restarts on that machine.
 *
 * This is still NOT server persistence: drafts are per-browser and per-device,
 * are invisible to teammates, and are lost if site data is cleared. The editor
 * states this plainly rather than implying durable storage.
 *
 * ─── Swapping in server persistence later ───────────────────────────────────
 * Nothing outside `use-lead-proposal.ts` reads this store. When a
 * `lead_proposals` table exists, replace the three calls in that hook with
 * useQuery/useMutation; this file can then be deleted untouched by any UI code.
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
