import { AnimatePresence, motion } from "framer-motion";
import { Download, FileText, FileType } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ExportFormat } from "@/features/proposal-editor/export/export-proposal";
import { cn } from "@/utils/cn";
import { popover } from "@/utils/motion";

type DownloadProposalMenuProps = {
  onSelect: (format: ExportFormat) => void;
  exportingFormat: ExportFormat | null;
  /** Disables the trigger for reasons other than an in-flight export. */
  disabled?: boolean;
  size?: "sm" | "md";
};

const FORMATS: Array<{
  format: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    format: "pdf",
    label: "Download as PDF",
    description: "Print-ready, fixed layout",
    icon: FileText,
  },
  {
    format: "docx",
    label: "Download as DOCX",
    description: "Editable in Word",
    icon: FileType,
  },
];

export function DownloadProposalMenu({
  onSelect,
  exportingFormat,
  disabled = false,
  size = "sm",
}: DownloadProposalMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isExporting = exportingFormat !== null;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Escape closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close once an export starts so the menu doesn't hover over the toast.
  useEffect(() => {
    if (isExporting) setOpen(false);
  }, [isExporting]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        ref={triggerRef}
        variant="secondary"
        size={size}
        onClick={() => setOpen((value) => !value)}
        disabled={disabled || isExporting}
        isLoading={isExporting}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="h-3.5 w-3.5" />
        {isExporting
          ? `Downloading ${exportingFormat.toUpperCase()}…`
          : "Download Proposal"}
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            variants={popover}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 z-30 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
          >
            {FORMATS.map(({ format, label, description, icon: Icon }) => (
              <button
                key={format}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSelect(format);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
                  "transition-colors hover:bg-surface-muted",
                  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                )}
              >
                <span className="asc-gradient-subtle mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent-text">
                  <Icon className="h-4 w-4" strokeWidth={1.85} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {description}
                  </span>
                </span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
