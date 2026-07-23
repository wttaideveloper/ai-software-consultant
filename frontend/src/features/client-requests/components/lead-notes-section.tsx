import { AnimatePresence, motion } from "framer-motion";
import { NotebookPen, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { useAuthStore } from "@/store/auth-store";
import { formatDate, formatTime } from "@/utils/format";

export type InternalNote = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

/**
 * Internal notes — deliberately in-memory only.
 *
 * There is no notes table and the schema is not being changed, so these live in
 * component state and are lost on unmount. The banner below states that plainly
 * rather than letting the UI imply durable storage. The shape mirrors what a
 * future `lead_notes` row would hold, so persisting later is a swap of the
 * state setter for a mutation.
 */
export function LeadNotesSection() {
  const authorName = useAuthStore((state) => state.user?.fullName ?? "You");
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [draft, setDraft] = useState("");

  const trimmed = draft.trim();

  const handleAdd = () => {
    if (trimmed.length === 0) return;

    setNotes((current) => [
      {
        id: crypto.randomUUID(),
        body: trimmed,
        authorName,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setDraft("");
  };

  return (
    <WorkspaceSection
      id="internal-notes"
      icon={NotebookPen}
      title="Internal Notes"
      description={`${notes.length} note${notes.length === 1 ? "" : "s"} · not visible to the client`}
    >
      <div
        role="note"
        className="mb-4 rounded-lg border border-warning/25 bg-warning-subtle px-3.5 py-2.5 text-xs leading-relaxed text-warning"
      >
        Notes are temporary and stored in this browser session only — they are not
        saved to the database and will be lost when you leave this page.
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          aria-label="New internal note"
          placeholder="Add a note for your team…"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={trimmed.length === 0}>
            Add note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {notes.map((note) => (
              <motion.li
                key={note.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="group flex gap-3 rounded-xl border border-border bg-canvas p-4"
              >
                <Avatar name={note.authorName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-medium text-foreground">
                      {note.authorName}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(note.createdAt)} at {formatTime(note.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-foreground-soft">
                    {note.body}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete note"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 focus-visible:opacity-100"
                  onClick={() =>
                    setNotes((current) =>
                      current.filter((item) => item.id !== note.id),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </WorkspaceSection>
  );
}
