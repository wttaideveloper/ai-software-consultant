import { FileText, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceSection } from "@/components/shared/workspace-section";

type LeadSummarySectionProps = {
  summary: string;
  onSave: (summary: string) => void;
  isSaving: boolean;
};

/**
 * The AI-generated requirement summary saved on the lead, rendered as markdown
 * and editable in place. Editing swaps the viewer for a textarea rather than
 * opening a modal — the summary is long, and a dialog would shrink the writing
 * area on exactly the section that needs the most room.
 */
export function LeadSummarySection({
  summary,
  onSave,
  isSaving,
}: LeadSummarySectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(summary);

  // Re-seed the draft whenever the saved summary changes (initial load, or a
  // successful save returning the persisted value).
  useEffect(() => {
    setDraft(summary);
  }, [summary]);

  const trimmed = draft.trim();
  const isUnchanged = trimmed === summary.trim();

  const handleCancel = () => {
    setDraft(summary);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave(trimmed);
    setIsEditing(false);
  };

  return (
    <WorkspaceSection
      id="requirement-summary"
      icon={FileText}
      title="Requirement Summary"
      description="AI-generated from the client's discovery answers"
      actions={
        isEditing ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isUnchanged || trimmed.length === 0}
            >
              Save summary
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )
      }
    >
      {isEditing ? (
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={16}
          aria-label="Requirement summary"
          hint="Markdown supported. This replaces the summary saved on the request."
          error={trimmed.length === 0 ? "Summary cannot be empty" : undefined}
        />
      ) : summary.trim().length === 0 ? (
        <p className="text-sm text-muted">
          No requirement summary was saved with this request.
        </p>
      ) : (
        <MarkdownViewer content={summary} className="text-sm" />
      )}
    </WorkspaceSection>
  );
}
