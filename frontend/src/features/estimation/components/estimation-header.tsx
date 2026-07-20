import { Pencil, RefreshCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Estimation } from "@/types";
import { formatRelativeTime } from "@/utils/format";

type EstimationHeaderProps = {
  consultationTitle: string;
  estimation: Estimation | null;
  isEditing: boolean;
  isGenerating: boolean;
  isSaving: boolean;
  onGenerate: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
};

export function EstimationHeader({
  consultationTitle,
  estimation,
  isEditing,
  isGenerating,
  isSaving,
  onGenerate,
  onEdit,
  onSave,
  onCancelEdit,
}: EstimationHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Project Estimation
          </h1>
          {estimation ? (
            <>
              <Badge variant="accent">v{estimation.version}</Badge>
              <Badge variant={estimation.generatedBy === "AI" ? "accent" : "default"}>
                {estimation.generatedBy === "AI" ? "AI Generated" : "Edited by you"}
              </Badge>
            </>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted">
          {consultationTitle}
          {estimation ? ` · Updated ${formatRelativeTime(estimation.updatedAt)}` : null}
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
        ) : estimation ? (
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
            Generate Estimation
          </Button>
        )}
      </div>
    </div>
  );
}
