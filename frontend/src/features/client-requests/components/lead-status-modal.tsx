import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CLIENT_LEAD_STATUS_META } from "@/features/client-requests/client-lead-status";
import { ClientLeadStatusBadge } from "@/features/client-requests/components/client-lead-status-badge";
import { CLIENT_LEAD_STATUSES, type ClientLeadStatus } from "@/types";
import { cn } from "@/utils/cn";

type LeadStatusModalProps = {
  open: boolean;
  onClose: () => void;
  currentStatus: ClientLeadStatus;
  onConfirm: (status: ClientLeadStatus) => void;
  isSaving: boolean;
};

/**
 * Status picker. Options come from CLIENT_LEAD_STATUSES, which mirrors the
 * pgEnum — no status is hardcoded here, so the list stays correct if the enum
 * ever gains a member.
 */
export function LeadStatusModal({
  open,
  onClose,
  currentStatus,
  onConfirm,
  isSaving,
}: LeadStatusModalProps) {
  const [selected, setSelected] = useState<ClientLeadStatus>(currentStatus);

  // Re-sync when reopened, so a cancelled edit doesn't persist a stale choice.
  useEffect(() => {
    if (open) setSelected(currentStatus);
  }, [open, currentStatus]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update status"
      description="Move this request to a different stage in your sales pipeline."
      size="sm"
    >
      <div className="flex flex-col gap-2">
        {CLIENT_LEAD_STATUSES.map((status) => {
          const isSelected = status === selected;
          const meta = CLIENT_LEAD_STATUS_META[status];

          return (
            <button
              key={status}
              type="button"
              onClick={() => setSelected(status)}
              aria-pressed={isSelected}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left",
                "transition-[border-color,background-color] duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isSelected
                  ? "border-accent/40 bg-accent-subtle"
                  : "border-border hover:border-border-strong hover:bg-surface-muted",
              )}
            >
              <span className="flex items-center gap-3">
                <ClientLeadStatusBadge status={status} />
                {status === currentStatus ? (
                  <span className="text-xs text-muted">Current</span>
                ) : null}
              </span>
              {isSelected ? (
                <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />
              ) : null}
              <span className="sr-only">{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(selected)}
          isLoading={isSaving}
          disabled={selected === currentStatus}
        >
          Save status
        </Button>
      </div>
    </Modal>
  );
}
