import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { LEAD_PROPOSALS_QUERY_KEY } from "@/features/lead-proposals/hooks/use-lead-proposals";
import { splitDraft } from "@/features/proposal-editor/lead-proposal.types";
import { useProposalDraftStore } from "@/features/proposal-editor/proposal-draft.store";
import { leadProposalsService } from "@/services/lead-proposals.service";
import type { LeadProposalVersions } from "@/types";

/**
 * One-time upgrade of a pre-`lead_proposals` browser draft into Version 1.
 *
 * Before this module existed, the editor saved to localStorage (see
 * proposal-draft.store.ts). Those drafts are real work, so the first time a lead
 * with a local draft and no server versions is opened, the draft is promoted to
 * V1 and the local copy is removed. From then on localStorage is never read or
 * written for that lead.
 *
 * Guards, in order:
 *  - runs only after the versions query has resolved (never against unknown state)
 *  - runs only when the lead has zero server versions, so it can never duplicate
 *    or overwrite real versions
 *  - a ref keeps it to one attempt per lead per mount, since the effect re-runs
 *    on every render of the section
 *  - the local draft is cleared only after the server confirms the write
 */
export function useMigrateLocalProposalDraft(
  leadId: string | undefined,
  versions: LeadProposalVersions | undefined,
) {
  const queryClient = useQueryClient();
  const storedDraft = useProposalDraftStore((state) =>
    leadId ? state.drafts[leadId] : undefined,
  );
  const clearDraft = useProposalDraftStore((state) => state.clearDraft);
  const attempted = useRef<string | null>(null);

  const migrate = useMutation({
    mutationFn: async (input: { leadId: string; title: string; content: ReturnType<typeof splitDraft>["content"] }) =>
      leadProposalsService.create(input.leadId, {
        title: input.title,
        content: input.content,
        notes: "Migrated from a locally saved draft.",
      }),
    onSuccess: (proposal, input) => {
      clearDraft(input.leadId);
      void queryClient.invalidateQueries({ queryKey: [LEAD_PROPOSALS_QUERY_KEY] });
      toast.success(
        `Your locally saved draft is now Proposal V${proposal.versionNumber}, stored on the server.`,
      );
    },
    onError: () => {
      // The local draft is deliberately left in place so the next open retries.
      toast.error("Couldn't upload your locally saved proposal draft. It's still saved in this browser.");
    },
  });

  useEffect(() => {
    if (!leadId || !storedDraft || !versions) return;
    if (versions.items.length > 0) return;
    if (attempted.current === leadId) return;

    attempted.current = leadId;
    const { title, content } = splitDraft(storedDraft.draft);
    migrate.mutate({
      leadId,
      title: title.trim() || "Migrated proposal draft",
      content,
    });
  }, [leadId, storedDraft, versions, migrate]);

  return { isMigrating: migrate.isPending };
}
