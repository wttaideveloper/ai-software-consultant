import {
  ArrowRight,
  Copy,
  FileSignature,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionError } from "@/components/shared/section-error";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadProposalStatusBadge } from "@/features/lead-proposals/components/lead-proposal-status-badge";
import {
  useCreateLeadProposal,
  useDeleteLeadProposal,
} from "@/features/lead-proposals/hooks/use-lead-proposal-mutations";
import { useLeadProposalVersions } from "@/features/lead-proposals/hooks/use-lead-proposals";
import { useMigrateLocalProposalDraft } from "@/features/lead-proposals/hooks/use-migrate-local-draft";
import { buildProposalDraft } from "@/features/proposal-editor/build-proposal-draft";
import { DownloadProposalMenu } from "@/features/proposal-editor/components/download-proposal-menu";
import { splitDraft, toDraft } from "@/features/proposal-editor/lead-proposal.types";
import { useExportProposal } from "@/features/proposal-editor/hooks/use-export-proposal";
import { leadProposalsService } from "@/services/lead-proposals.service";
import type { ClientLeadDetail, LeadProposal } from "@/types";
import { formatDate, formatRelativeTime } from "@/utils/format";

/** The three numbers an admin needs before opening anything. */
function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas px-4 py-3">
      <p className="text-[11px] font-medium tracking-wider text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Proposal Versions — replaces the old single "Generate / Edit Proposal" button.
 *
 * A lead now has a list of versions rather than one draft, so this section shows
 * the roll-up (active / latest / total) and every version with its own actions.
 */
export function LeadProposalVersionsSection({ lead }: { lead: ClientLeadDetail }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useLeadProposalVersions(lead.id);
  // Promotes a pre-lead_proposals browser draft to V1 the first time this lead
  // is opened. No-op for every lead that never had one.
  const { isMigrating } = useMigrateLocalProposalDraft(lead.id, data);
  const createProposal = useCreateLeadProposal(lead.id);
  const deleteProposal = useDeleteLeadProposal();
  const { runExport, exportingFormat } = useExportProposal();

  const [pendingDelete, setPendingDelete] = useState<LeadProposal | null>(null);
  /** Which row is being exported — the menu is per-row, so the id disambiguates. */
  const [exportingId, setExportingId] = useState<string | null>(null);

  const openVersion = (proposalId: string) =>
    navigate(`/client-requests/${lead.id}/proposals/${proposalId}`);

  /**
   * "Create New Version" prefills from the lead's CURRENT requirement summary,
   * features and estimate — reusing buildProposalDraft(), the same generator the
   * editor's "Rebuild from request" uses. The server assigns the version number.
   */
  const createVersion = () => {
    const { title, content } = splitDraft(buildProposalDraft(lead));
    createProposal.mutate(
      { title, content, reason: "MANUAL" },
      { onSuccess: (proposal) => openVersion(proposal.id) },
    );
  };

  /**
   * Duplicating copies server-side through createNextVersionFromExisting, so the
   * body is taken atomically and the fork is recorded like any other.
   */
  const duplicateVersion = (proposal: LeadProposal) => {
    createProposal.mutate(
      {
        sourceProposalId: proposal.id,
        title: `${proposal.title} (copy)`,
        reason: "DUPLICATED",
      },
      { onSuccess: (created) => openVersion(created.id) },
    );
  };

  /**
   * Exports a specific version. The list rows carry no body (the list DTO omits
   * it), so the version is fetched on demand and handed to the existing
   * export pipeline unchanged.
   */
  const exportVersion = async (
    proposal: LeadProposal,
    format: "pdf" | "docx",
  ) => {
    setExportingId(proposal.id);
    try {
      const detail = await leadProposalsService.getById(proposal.id);
      await runExport(format, {
        draft: toDraft(detail.title, detail.content),
        lead,
      });
    } finally {
      setExportingId(null);
    }
  };

  const versions = data?.items ?? [];
  const summary = data?.summary;

  return (
    <WorkspaceSection
      id="proposal"
      icon={FileSignature}
      title="Proposal Versions"
      description="Every proposal drafted for this request"
      actions={
        <Button
          size="sm"
          onClick={createVersion}
          isLoading={createProposal.isPending}
          disabled={isLoading}
        >
          <Plus className="h-3.5 w-3.5" />
          Create New Version
        </Button>
      }
    >
      {isError ? (
        <SectionError message="Couldn't load proposal versions." onRetry={refetch} />
      ) : isLoading || isMigrating ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              label="Latest Version"
              value={summary?.latest ? `V${summary.latest.versionNumber}` : "—"}
              hint={
                summary?.latest
                  ? `${summary.latest.status.toLowerCase()} · updated ${formatRelativeTime(summary.latest.updatedAt)}`
                  : "Nothing drafted yet"
              }
            />
            <SummaryTile
              label="Current Draft"
              value={
                summary?.workingDraft
                  ? `V${summary.workingDraft.versionNumber}`
                  : "None open"
              }
              hint={
                summary?.workingDraft
                  ? `updated ${formatRelativeTime(summary.workingDraft.updatedAt)}`
                  : "No draft in progress"
              }
            />
            <SummaryTile
              label="Latest Sent"
              value={
                summary?.latestSent ? `V${summary.latestSent.versionNumber}` : "—"
              }
              hint={
                summary?.latestSent
                  ? `sent ${formatRelativeTime(summary.latestSent.updatedAt)}`
                  : "Nothing sent yet"
              }
            />
            <SummaryTile
              label="Latest Accepted"
              value={
                summary?.latestAccepted
                  ? `V${summary.latestAccepted.versionNumber}`
                  : "—"
              }
              hint={
                summary?.latestAccepted
                  ? `accepted ${formatRelativeTime(summary.latestAccepted.updatedAt)}`
                  : `${summary?.total ?? 0} version${summary?.total === 1 ? "" : "s"} in total`
              }
            />
          </div>

          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-canvas px-6 py-10 text-center">
              <div className="asc-gradient-subtle mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-accent-text">
                <FileSignature className="h-5 w-5" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-medium text-foreground">
                No proposal versions yet.
              </p>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted text-pretty">
                Create the first version — it's pre-filled from this request's
                requirement summary, features and estimate.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-canvas px-4 py-3 transition-colors hover:border-border-strong lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="asc-tabular flex h-9 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs font-semibold text-foreground-soft">
                      V{version.versionNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {version.title}
                        </p>
                        <LeadProposalStatusBadge status={version.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {version.createdByName ?? "Unknown author"} ·{" "}
                        {formatDate(version.createdAt)} · updated{" "}
                        {formatRelativeTime(version.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <DownloadProposalMenu
                      onSelect={(format) => void exportVersion(version, format)}
                      exportingFormat={
                        exportingId === version.id ? exportingFormat : null
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateVersion(version)}
                      isLoading={createProposal.isPending}
                      aria-label={`Duplicate version ${version.versionNumber}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </Button>
                    {/* Drafts only — the server enforces the same rule. */}
                    {version.status === "DRAFT" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDelete(version)}
                        aria-label={`Delete version ${version.versionNumber}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    ) : null}
                    {/*
                      Open always just opens — browsing history must never fork a
                      version. A locked version opens read-only, where "Edit as
                      new draft" performs the fork.
                    */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openVersion(version.id)}
                    >
                      {version.status === "DRAFT" ? "Open" : "View"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            deleteProposal.mutate(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
        title={`Delete V${pendingDelete?.versionNumber ?? ""}?`}
        description="This draft will be removed from the version list. Version numbers are never reused, so the next version continues from where this one left off."
        confirmLabel="Delete draft"
        isLoading={deleteProposal.isPending}
      />
    </WorkspaceSection>
  );
}
