import { ArrowRight, FileSignature, PencilLine } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProposalDraftStore } from "@/features/proposal-editor/proposal-draft.store";
import { formatRelativeTime } from "@/utils/format";

/**
 * Entry point to the Proposal Editor.
 *
 * Reports real draft state rather than always claiming no proposal exists —
 * the draft store is the same one the editor writes to. Note that drafts are
 * browser-local (see proposal-draft.store.ts), so "no proposal" here means
 * "none saved in this browser".
 */
export function LeadProposalSection() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const stored = useProposalDraftStore((state) =>
    leadId ? state.drafts[leadId] : undefined,
  );

  const openEditor = () => navigate(`/client-requests/${leadId}/proposal`);

  return (
    <WorkspaceSection
      id="proposal"
      icon={FileSignature}
      title="Proposal"
      description="Client-ready proposal document"
      actions={
        stored ? (
          <Badge variant="info" size="sm" dot>
            Draft
          </Badge>
        ) : null
      }
    >
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-canvas px-6 py-10 text-center">
        <div className="asc-gradient-subtle mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-accent-text">
          <FileSignature className="h-5 w-5" strokeWidth={1.7} />
        </div>

        {stored ? (
          <>
            <p className="text-sm font-medium text-foreground">
              {stored.draft.title}
            </p>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted text-pretty">
              Draft saved{" "}
              {stored.savedAt ? formatRelativeTime(stored.savedAt) : "locally"} in
              this browser. Continue editing before sharing it with the client.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              No proposal has been created yet.
            </p>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted text-pretty">
              Start a proposal pre-filled from this request's requirement summary,
              features and estimate.
            </p>
          </>
        )}

        <Button className="mt-6" onClick={openEditor}>
          {stored ? (
            <PencilLine className="h-4 w-4" />
          ) : null}
          Generate / Edit Proposal
          {stored ? null : <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </WorkspaceSection>
  );
}
