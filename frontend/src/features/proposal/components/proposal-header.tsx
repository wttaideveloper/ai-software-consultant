import { Pencil, RefreshCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROPOSAL_STATUS_META } from "@/features/proposal/proposal-status";
import type { Proposal } from "@/types";
import { formatRelativeTime } from "@/utils/format";

type ProposalHeaderProps = {
  consultationTitle: string;
  proposal: Proposal | null;
  isEditing: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  onGenerate: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
};

export function ProposalHeader({
  consultationTitle,
  proposal,
  isEditing,
  isGenerating,
  isSaving,
  onGenerate,
  onEdit,
  onSave,
  onCancelEdit,
}: ProposalHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Project Proposal
          </h1>
          {proposal ? (
            <>
              <Badge variant={PROPOSAL_STATUS_META[proposal.status].variant}>
                {PROPOSAL_STATUS_META[proposal.status].label}
              </Badge>
              <Badge variant="accent">v{proposal.version}</Badge>
              <Badge variant={proposal.generatedBy === "AI" ? "accent" : "default"}>
                {proposal.generatedBy === "AI" ? "AI Generated" : "Edited by you"}
              </Badge>
            </>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted">
          {consultationTitle}
          {proposal ? ` · Updated ${formatRelativeTime(proposal.updatedAt)}` : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isEditing ? (
          <>
            <Button variant="secondary" size="sm" onClick={onCancelEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} isLoading={isSaving}>
              Save
            </Button>
          </>
        ) : proposal ? (
          <>
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={onGenerate} isLoading={isGenerating}>
              <RefreshCcw className="h-3.5 w-3.5" />
              Re-generate
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onGenerate} isLoading={isGenerating}>
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </Button>
        )}
      </div>
    </div>
  );
}
