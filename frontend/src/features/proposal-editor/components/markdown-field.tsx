import { Eye, PencilLine } from "lucide-react";
import { useState } from "react";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MarkdownFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  rows?: number;
  placeholder?: string;
};

/**
 * Textarea + markdown preview toggle.
 *
 * No rich-text editor is installed in this project, so per the spec this is
 * clean textarea editing — paired with the existing MarkdownViewer so an admin
 * can check formatting without leaving the section.
 */
export function MarkdownField({
  value,
  onChange,
  label,
  hint,
  rows = 8,
  placeholder,
}: MarkdownFieldProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        {label ? (
          <span className="text-sm font-medium text-foreground-soft">{label}</span>
        ) : (
          <span />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview((current) => !current)}
          aria-pressed={showPreview}
        >
          {showPreview ? (
            <>
              <PencilLine className="h-3.5 w-3.5" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Preview
            </>
          )}
        </Button>
      </div>

      {showPreview ? (
        <div className="min-h-28 rounded-lg border border-border bg-canvas p-4">
          {value.trim().length === 0 ? (
            <p className="text-sm text-muted">Nothing to preview yet.</p>
          ) : (
            <MarkdownViewer content={value} className="text-sm" />
          )}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          hint={hint}
          placeholder={placeholder}
          aria-label={label}
        />
      )}
    </div>
  );
}
