import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/utils/cn";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  isLoading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isLoading,
}: ConfirmDialogProps) {
  const isDanger = tone === "danger";
  const Icon = isDanger ? AlertTriangle : HelpCircle;

  return (
    // Title/description render in the body here so they can sit beside the
    // tone icon, which is the cue that carries "this is destructive".
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            isDanger
              ? "bg-danger-subtle text-danger"
              : "bg-accent-subtle text-accent-text",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground text-balance">
            {title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={isDanger ? "danger" : "primary"}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
