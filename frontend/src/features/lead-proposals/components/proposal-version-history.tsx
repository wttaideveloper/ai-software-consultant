import { History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadProposalStatusBadge } from "@/features/lead-proposals/components/lead-proposal-status-badge";
import type { LeadProposal } from "@/types";
import { cn } from "@/utils/cn";
import { formatRelativeTime } from "@/utils/format";

type ProposalVersionHistoryProps = {
  versions: LeadProposal[];
  /** The version currently open in the editor. */
  currentId: string;
  onSelect: (proposal: LeadProposal) => void;
  isLoading?: boolean;
};

/**
 * Full version history for the proposal on screen, newest first.
 *
 * Every version is selectable, including locked ones: browsing history must
 * never fork a version, so selecting one only navigates. The fork happens when
 * the admin asks to edit a locked version, not when they look at it.
 *
 * This is also the seam a future Version Compare hangs off — the panel already
 * has the full list and knows which one is current, so comparison needs a
 * second selection and a diff view, nothing more.
 */
export function ProposalVersionHistory({
  versions,
  currentId,
  onSelect,
  isLoading,
}: ProposalVersionHistoryProps) {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-muted" strokeWidth={1.85} />
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Proposal History
        </h2>
        <span className="ml-auto text-xs text-muted">
          {versions.length} version{versions.length === 1 ? "" : "s"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {versions.map((version) => {
            const isCurrent = version.id === currentId;

            return (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => onSelect(version)}
                  aria-current={isCurrent ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    isCurrent
                      ? "border-accent/40 bg-accent-subtle"
                      : "border-transparent hover:border-border hover:bg-surface-muted",
                  )}
                >
                  <span className="asc-tabular w-8 shrink-0 text-sm font-semibold text-foreground">
                    V{version.versionNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <LeadProposalStatusBadge status={version.status} />
                      {isCurrent ? (
                        <span className="text-[11px] font-medium tracking-wide text-accent-text uppercase">
                          Current
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {formatRelativeTime(version.updatedAt)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted">
        Versions are never overwritten. Editing a locked version creates a new
        draft from it.
      </p>
    </aside>
  );
}
