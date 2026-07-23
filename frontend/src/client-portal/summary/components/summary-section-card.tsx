import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { Button } from "@/components/ui/button";
import type { SummarySection } from "@/client-portal/summary/parse-summary-sections";
import { cn } from "@/utils/cn";

type SummarySectionCardProps = {
  index: number;
  section: SummarySection;
  onSave: (body: string) => void;
};

/**
 * One `##` section of the summary, read-first with inline editing.
 *
 * A prospective client should see their requirements as a document, not as
 * markdown source — so the rendered view is the default and the raw text only
 * appears once they choose to edit that one section. Editing a single section
 * at a time is far less intimidating than one large textarea, and it keeps any
 * mistake contained to the part they were working on.
 */
export function SummarySectionCard({
  index,
  section,
  onSave,
}: SummarySectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(section.body);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Re-seed when the underlying section changes (regenerate, or an edit
  // elsewhere shifting content).
  useEffect(() => {
    setDraft(section.body);
  }, [section.body]);

  // Grow the textarea to fit its content so nothing is hidden behind an inner
  // scrollbar — the original single-box editor scrolled and lost context.
  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node || !isEditing) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [draft, isEditing]);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  const hasContent = section.body.trim().length > 0;
  const isUnchanged = draft.trim() === section.body.trim();

  const handleCancel = () => {
    setDraft(section.body);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave(draft);
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
    // Ctrl/Cmd+Enter saves — the common shortcut for committing a text field.
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (!isUnchanged) handleSave();
    }
  };

  return (
    <motion.section
      layout="position"
      className={cn(
        "group scroll-mt-32 rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-200",
        isEditing
          ? "border-accent/40 shadow-md"
          : "border-border hover:border-border-strong hover:shadow-sm",
      )}
      id={section.id}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="asc-gradient-subtle flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-accent-text"
          >
            {index + 1}
          </span>
          <h3 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {section.heading}
          </h3>
        </div>

        {isEditing ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isUnchanged}>
              <Check className="h-3.5 w-3.5" />
              Done
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            aria-label={`Edit ${section.heading}`}
            // Always visible on touch; reveals on hover/focus on pointer devices.
            className="shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus-visible:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </header>

      <div className="px-4 py-4 sm:px-5">
        <AnimatePresence mode="wait" initial={false}>
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                aria-label={`${section.heading} content`}
                className={cn(
                  "w-full resize-none rounded-lg border border-border bg-canvas px-3.5 py-3",
                  "font-mono text-[13px] leading-relaxed text-foreground",
                  "transition-[border-color,box-shadow] duration-200",
                  "focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20",
                )}
              />
              <p className="mt-2 text-xs text-muted">
                Use <code className="rounded bg-surface-muted px-1 py-0.5">-</code> for
                bullets and <code className="rounded bg-surface-muted px-1 py-0.5">**bold**</code>.
                Press <kbd className="rounded border border-border bg-surface px-1">Esc</kbd> to
                cancel.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="read"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {hasContent ? (
                <MarkdownViewer content={section.body} className="text-sm" />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground-soft"
                >
                  Nothing here yet — click to add details.
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
