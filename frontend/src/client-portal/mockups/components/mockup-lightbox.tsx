import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { modalOverlay, modalPanel } from "@/utils/motion";

type MockupLightboxProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  screenName: string;
  description: string;
};

/**
 * Fullscreen view of a single concept screen, opened by clicking its hero image.
 *
 * Follows the same portal + AnimatePresence + Escape/backdrop-to-close convention
 * as `Modal`/`Drawer`, but with minimal chrome so the image gets the whole viewport
 * on a dark backdrop — the point of a lightbox. Purely presentational: it renders an
 * already-loaded image, touching no API, storage, or generation logic.
 */
export function MockupLightbox({
  open,
  onClose,
  src,
  screenName,
  description,
}: MockupLightboxProps) {
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    // Move focus onto the close control so Escape/Enter work immediately and
    // keyboard focus doesn't stay stranded on the image behind the overlay.
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${screenName} concept screen`}
        >
          <motion.div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" />
          </motion.button>

          <motion.figure
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 flex max-h-full w-full max-w-6xl flex-col items-center gap-4"
            // Clicks on the image/caption shouldn't fall through to the backdrop.
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={src}
              alt={`Concept mockup of the ${screenName} screen`}
              className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
            <figcaption className="max-w-2xl text-center">
              <p className="text-base font-semibold tracking-tight text-white">
                {screenName}
              </p>
              {description ? (
                <p className="mt-1 text-sm text-white/70 text-pretty">{description}</p>
              ) : null}
            </figcaption>
          </motion.figure>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
