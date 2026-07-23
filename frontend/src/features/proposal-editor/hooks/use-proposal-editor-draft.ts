import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useUpdateLeadProposal } from "@/features/lead-proposals/hooks/use-lead-proposal-mutations";
import { buildProposalDraft } from "@/features/proposal-editor/build-proposal-draft";
import {
  splitDraft,
  toDraft,
  type LeadProposalDraft,
} from "@/features/proposal-editor/lead-proposal.types";
import type { ClientLeadDetail, LeadProposalDetail } from "@/types";

type UseProposalEditorDraftResult = {
  /** The working copy the editor binds to. */
  draft: LeadProposalDraft | null;
  /** Shallow-merge a change into the working copy. */
  patch: (next: Partial<LeadProposalDraft>) => void;
  /** True when the working copy differs from the saved version. */
  isDirty: boolean;
  save: () => void;
  isSaving: boolean;
  /** ISO timestamp of the last server save. */
  savedAt: string | null;
  /** Discards edits and returns to the saved version. */
  reset: () => void;
  /** Rebuilds every section from the lead's summary/features/estimate. */
  regenerateFromLead: () => void;
};

/**
 * The editor's single source of truth for one proposal version.
 *
 * Still the ONLY seam between the editor UI and storage — the same contract the
 * localStorage-backed version exposed (draft / isDirty / save / isSaving /
 * savedAt), which is exactly why swapping in `lead_proposals` meant rewriting
 * this hook and none of the editor components.
 *
 * The working copy is local state, not query state: an admin types continuously
 * and a background refetch must never overwrite half-written prose. It re-seeds
 * only when the editor switches to a different version.
 */
export function useProposalEditorDraft(
  proposal: LeadProposalDetail | undefined,
  lead: ClientLeadDetail | undefined,
): UseProposalEditorDraftResult {
  const [draft, setDraft] = useState<LeadProposalDraft | null>(null);
  /** Which version the working copy was seeded from. */
  const seededId = useRef<string | null>(null);
  const updateProposal = useUpdateLeadProposal(proposal?.id);

  /** What "dirty" is measured against: the version as last saved. */
  const baseline = useMemo(
    () => (proposal ? toDraft(proposal.title, proposal.content) : null),
    [proposal],
  );

  // Seeds once per version id: opening a different version re-seeds, while an
  // ordinary refetch of the same version leaves in-progress edits alone. The
  // ref (rather than a trimmed dependency array) is what encodes that rule, so
  // the effect can depend on everything it reads.
  useEffect(() => {
    if (!proposal) {
      setDraft(null);
      seededId.current = null;
      return;
    }

    if (seededId.current === proposal.id) return;

    seededId.current = proposal.id;
    setDraft(toDraft(proposal.title, proposal.content));
  }, [proposal]);

  const patch = useCallback((next: Partial<LeadProposalDraft>) => {
    setDraft((current) => (current ? { ...current, ...next } : current));
  }, []);

  const isDirty = useMemo(() => {
    if (!draft || !baseline) return false;
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [draft, baseline]);

  const save = useCallback(() => {
    if (!proposal || !draft) return;

    if (draft.title.trim().length === 0) {
      toast.error("Give the proposal a title before saving.");
      return;
    }

    updateProposal.mutate(splitDraft(draft), {
      onSuccess: () => toast.success(`Proposal V${proposal.versionNumber} saved.`),
    });
  }, [proposal, draft, updateProposal]);

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
    isSaving: updateProposal.isPending,
    savedAt: proposal?.updatedAt ?? null,
    reset,
    regenerateFromLead,
  };
}
