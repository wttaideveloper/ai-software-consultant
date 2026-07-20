import { ConsultationStatusBadge } from "@/features/consultations/components/consultation-status-badge";
import { WorkspaceActionsMenu } from "@/features/consultations/components/workspace-actions-menu";
import type { Consultation } from "@/types";
import { formatRelativeTime } from "@/utils/format";

type WorkspaceHeaderProps = {
  consultation: Consultation;
  onEdit: () => void;
  onDelete: () => void;
};

export function WorkspaceHeader({ consultation, onEdit, onDelete }: WorkspaceHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
          {consultation.title}
        </h1>
        <div className="mt-1.5 flex items-center gap-2">
          <ConsultationStatusBadge status={consultation.status} />
          <span className="text-xs text-muted">
            Updated {formatRelativeTime(consultation.updatedAt)}
          </span>
        </div>
      </div>

      <WorkspaceActionsMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
