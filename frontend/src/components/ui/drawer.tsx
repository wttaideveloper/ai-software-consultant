import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { drawerPanel, modalOverlay } from "@/utils/motion";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "left",
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.aside
            variants={{
              ...drawerPanel,
              hidden: { x: side === "left" ? "-100%" : "100%" },
              exit: {
                x: side === "left" ? "-100%" : "100%",
                transition: { duration: 0.2 },
              },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute top-0 flex h-full w-[min(20rem,88vw)] flex-col border-border bg-surface",
              side === "left" ? "left-0 border-r" : "right-0 border-l",
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
