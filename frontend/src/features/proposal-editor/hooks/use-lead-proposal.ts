import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buildProposalDraft } from "@/features/proposal-editor/build-proposal-draft";
import type { LeadProposalDraft } from "@/features/proposal-editor/lead-proposal.types";
import { useProposalDraftStore } from "@/features/proposal-editor/proposal-draft.store";
import type { ClientLeadDetail } from "@/types";

type UseLeadProposalResult = {
  /** The working copy the editor binds to. */
  draft: LeadProposalDraft | null;
  /** Shallow-merge a change into the working copy. */
  patch: (next: Partial<LeadProposalDraft>) => void;
  /** True when the working copy differs from what was last saved. */
  isDirty: boolean;
  save: () => void;
  isSaving: boolean;
  /** ISO timestamp of the last save, or null if never saved. */
  savedAt: string | null;
  /** Discards edits and returns to the last saved state (or a fresh prefill). */
  reset: () => void;
  /** Rebuilds from the lead's summary/features/estimate, discarding all edits. */
  regenerateFromLead: () => void;
};

/**
 * The editor's single source of truth for a lead's proposal.
 *
 * This hook is the ONLY seam between the UI and storage. It deliberately
 * exposes a server-shaped interface (draft / isDirty / save / isSaving /
 * savedAt) even though persistence is currently local, so introducing a real
 * `lead_proposals` endpoint later means rewriting this file alone — no editor
 * component changes.
 */
export function useLeadProposal(
  lead: ClientLeadDetail | undefined,
): UseLeadProposalResult {
  const stored = useProposalDraftStore((state) =>
    lead ? state.drafts[lead.id] : undefined,
  );
  const saveDraft = useProposalDraftStore((state) => state.saveDraft);

  const [draft, setDraft] = useState<LeadProposalDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // The baseline that "dirty" is measured against: whatever was last saved,
  // falling back to a fresh prefill for a lead with no draft yet.
  const baseline = useMemo(() => {
    if (!lead) return null;
    return stored?.draft ?? buildProposalDraft(lead);
  }, [lead, stored?.draft]);

  // Seed the working copy once the lead resolves. Keyed on lead.id so opening a
  // different lead re-seeds, but ordinary edits are never clobbered.
  useEffect(() => {
    if (!lead) {
      setDraft(null);
      return;
    }
    setDraft(
      useProposalDraftStore.getState().drafts[lead.id]?.draft ??
        buildProposalDraft(lead),
    );
  }, [lead?.id, lead]);

  const patch = useCallback((next: Partial<LeadProposalDraft>) => {
    setDraft((current) => (current ? { ...current, ...next } : current));
  }, []);

  const isDirty = useMemo(() => {
    if (!draft || !baseline) return false;
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [draft, baseline]);

  const save = useCallback(() => {
    if (!lead || !draft) return;

    // Mirrors an async mutation so the button's loading state and the eventual
    // swap to a real request behave identically.
    setIsSaving(true);
    saveDraft(lead.id, draft);
    setIsSaving(false);
    toast.success("Proposal draft saved to this browser.");
  }, [lead, draft, saveDraft]);

  const reset = useCallback(() => {
    if (baseline) setDraft(baseline);
  }, [baseline]);

  const regenerateFromLead = useCallback(() => {
    if (!lead) return;
    setDraft(buildProposalDraft(lead));
    toast.info("Proposal rebuilt from the request. Save to keep the changes.");
  }, [lead]);

  return {
    draft,
    patch,
    isDirty,
    save,
    isSaving,
    savedAt: stored?.savedAt ?? null,
    reset,
    regenerateFromLead,
  };
}
