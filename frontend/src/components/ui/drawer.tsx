import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
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
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    // Matches Modal: without this the page behind the drawer still scrolls,
    // which is especially wrong for the mobile nav.
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
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
              "absolute top-0 flex h-full w-[min(20rem,88vw)] flex-col border-border bg-surface shadow-xl",
              side === "left" ? "left-0 border-r" : "right-0 border-l",
              className,
            )}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <h2
                id={titleId}
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                {title}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close drawer"
              >
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
