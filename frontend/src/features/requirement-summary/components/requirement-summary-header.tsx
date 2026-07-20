import { Pencil, RefreshCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RequirementSummary } from "@/types";
import { formatRelativeTime } from "@/utils/format";

type RequirementSummaryHeaderProps = {
  consultationTitle: string;
  summary: RequirementSummary | null;
  isEditing: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  onGenerate: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
};

export function RequirementSummaryHeader({
  consultationTitle,
  summary,
  isEditing,
  isGenerating,
  isSaving,
  onGenerate,
  onEdit,
  onSave,
  onCancelEdit,
}: RequirementSummaryHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Requirement Summary
          </h1>
          {summary ? (
            <>
              <Badge variant={summary.status === "finalized" ? "success" : "default"}>
                {summary.status === "finalized" ? "Finalized" : "Draft"}
              </Badge>
              <Badge variant="accent">v{summary.version}</Badge>
              <Badge variant={summary.generatedBy === "AI" ? "accent" : "default"}>
                {summary.generatedBy === "AI" ? "AI Generated" : "Edited by you"}
              </Badge>
            </>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted">
          {consultationTitle}
          {summary ? ` · Updated ${formatRelativeTime(summary.updatedAt)}` : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isEditing ? (
          <>
            <Button variant="secondary" size="sm" onClick={onCancelEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </>
        ) : summary ? (
          <>
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="secondary" size="sm" onClick={onGenerate} isLoading={isGenerating}>
              <RefreshCcw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onGenerate} isLoading={isGenerating}>
            <Sparkles className="h-3.5 w-3.5" />
            Generate Summary
          </Button>
        )}
      </div>
    </div>
  );
}
