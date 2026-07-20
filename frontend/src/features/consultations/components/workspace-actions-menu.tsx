import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type WorkspaceActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export function WorkspaceActionsMenu({ onEdit, onDelete }: WorkspaceActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        aria-label="Consultation actions"
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface p-1"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-soft hover:bg-surface-muted"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-subtle"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
