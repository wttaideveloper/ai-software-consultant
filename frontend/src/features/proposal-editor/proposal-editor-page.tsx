import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  FileSearch,
  FileSignature,
  Lightbulb,
  Lock,
  PencilLine,
  RotateCcw,
  Save,
  ScrollText,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionError } from "@/components/shared/section-error";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useClientLead } from "@/features/client-requests/hooks/use-client-lead";
import { LeadProposalStatusActions } from "@/features/lead-proposals/components/lead-proposal-status-actions";
import { LeadProposalStatusBadge } from "@/features/lead-proposals/components/lead-proposal-status-badge";
import { ProposalVersionHistory } from "@/features/lead-proposals/components/proposal-version-history";
import {
  useOpenProposalForEditing,
  useRegenerateLeadProposal,
} from "@/features/lead-proposals/hooks/use-lead-proposal-mutations";
import {
  useLeadProposal,
  useLeadProposalVersions,
} from "@/features/lead-proposals/hooks/use-lead-proposals";
import { buildProposalDraft } from "@/features/proposal-editor/build-proposal-draft";
import { splitDraft } from "@/features/proposal-editor/lead-proposal.types";
import { DownloadProposalMenu } from "@/features/proposal-editor/components/download-proposal-menu";
import { ListField } from "@/features/proposal-editor/components/list-field";
import { MarkdownField } from "@/features/proposal-editor/components/markdown-field";
import { ProposalClientInfo } from "@/features/proposal-editor/components/proposal-client-info";
import { ProposalProjectEstimate } from "@/features/proposal-editor/components/proposal-project-estimate";
import { ProposalFeaturesEditor } from "@/features/proposal-editor/components/proposal-features-editor";
import { deriveProposalEstimate } from "@/features/proposal-editor/proposal-estimate";
import { ProposalEditorSkeleton } from "@/features/proposal-editor/components/proposal-editor-skeleton";
import { useExportProposal } from "@/features/proposal-editor/hooks/use-export-proposal";
import { useProposalEditorDraft } from "@/features/proposal-editor/hooks/use-proposal-editor-draft";
import { formatRelativeTime } from "@/utils/format";
import { staggerContainer } from "@/utils/motion";

/**
 * Proposal Editor — a single-page workspace for one proposal VERSION.
 *
 * Addressed by proposal id, not by lead: a lead has many versions and this page
 * edits exactly one of them. The body is persisted server-side in
 * `lead_proposals`; status moves through its own actions so saving prose can
 * never change what stage the proposal is at.
 *
 * The section layout below is unchanged from the original editor — only its
 * storage seam (useProposalEditorDraft) and version chrome are new.
 */
export function ProposalEditorPage() {
  const { leadId, proposalId } = useParams<{
    leadId: string;
    proposalId: string;
  }>();
  const navigate = useNavigate();

  const { data: lead, isLoading: isLoadingLead, isError: isErrorLead, error: leadError, refetch } =
    useClientLead(leadId);
  const {
    data: proposal,
    isLoading: isLoadingProposal,
    isError: isErrorProposal,
    error: proposalError,
  } = useLeadProposal(proposalId);

  const { data: versions, isLoading: isLoadingVersions } =
    useLeadProposalVersions(leadId);

  const { draft, patch, isDirty, save, isSaving, savedAt, reset } =
    useProposalEditorDraft(proposal, lead);
  const { runExport, exportingFormat } = useExportProposal();
  const openForEditing = useOpenProposalForEditing();
  const regenerate = useRegenerateLeadProposal();

  const isLoading = isLoadingLead || isLoadingProposal;
  const isError = isErrorLead || isErrorProposal;
  const error = leadError ?? proposalError;

  const backToLead = () => navigate(`/client-requests/${leadId}`);
  const openVersion = (proposalId: string) =>
    navigate(`/client-requests/${leadId}/proposals/${proposalId}`);

  /**
   * Only drafts are editable. Everything else is a record of what existed at
   * that point, so the form renders read-only and the way forward is a fork.
   */
  const isLocked = Boolean(proposal) && proposal!.status !== "DRAFT";

  /**
   * Rule 1/2/3 in one action: the server returns this version if it is a draft,
   * or a new draft forked from it if it is locked. No dialog — nothing is
   * overwritten either way, so there is no decision to confirm.
   */
  const editThisVersion = () => {
    if (!proposal) return;
    openForEditing.mutate(proposal.id, {
      onSuccess: (session) => {
        if (session.proposal.id !== proposal.id) {
          openVersion(session.proposal.id);
        }
      },
    });
  };

  /**
   * Regenerate never overwrites: the body is rebuilt from the lead's current
   * summary/features/estimate by the same pure generator the prefill uses, and
   * stored as a new version.
   */
  const regenerateAsNewVersion = () => {
    if (!proposal || !lead) return;
    const { title, content } = splitDraft(buildProposalDraft(lead));
    regenerate.mutate(
      { proposalId: proposal.id, payload: { title, content } },
      { onSuccess: (created) => openVersion(created.id) },
    );
  };

  // Native guard against losing unsaved work on reload / tab close. Client-side
  // route changes aren't covered — react-router v7 without a data router has no
  // blocker API available here.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const isNotFound = isAxiosError(error) && error.response?.status === 404;

  if (isLoading) {
    return <ProposalEditorSkeleton />;
  }

  // Covers both a missing lead and a missing/deleted version — either way the
  // thing being edited doesn't exist, and the way back is the same.
  if (isNotFound) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Proposal not found"
        description="This proposal version doesn't exist, or it has been deleted."
        action={
          <Button variant="secondary" onClick={backToLead}>
            <ArrowLeft className="h-4 w-4" />
            Back to Lead Details
          </Button>
        }
      />
    );
  }

  if (isError || !lead || !proposal || !draft) {
    return (
      <div>
        <div className="mb-5">
          <Button variant="ghost" size="sm" onClick={backToLead}>
            <ArrowLeft className="h-4 w-4" />
            Back to Lead Details
          </Button>
        </div>
        <SectionError
          message="Couldn't load this proposal."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Sticky header. top-16 clears the app Navbar; negative insets let the
          frosted bar span the main region's horizontal padding. */}
      <div className="asc-glass sticky top-16 z-20 -mx-4 mb-5 border-b border-border px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={backToLead}
              aria-label="Back to Lead Details"
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wider text-accent-text uppercase">
                Proposal Editor · Version {proposal.versionNumber}
              </p>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {lead.company ?? lead.name}
                </h1>
                <Badge variant="default" size="sm">
                  V{proposal.versionNumber}
                </Badge>
                <LeadProposalStatusBadge status={proposal.status} />
                {isDirty ? (
                  <Badge variant="warning" size="sm" dot>
                    Unsaved changes
                  </Badge>
                ) : savedAt ? (
                  <span className="text-xs text-muted">
                    Saved {formatRelativeTime(savedAt)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <LeadProposalStatusActions proposal={proposal} />
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerateAsNewVersion}
              isLoading={regenerate.isPending}
              title="Rebuild every section from the request's summary, features and estimate — always as a new version"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Regenerate
            </Button>
            {isDirty ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" />
                Discard
              </Button>
            ) : null}
            {/* Exports the current on-screen draft, saved or not — what the
                admin sees is what lands in the document. */}
            <DownloadProposalMenu
              onSelect={(format) => void runExport(format, { draft, lead })}
              exportingFormat={exportingFormat}
            />
            {isLocked ? (
              <Button
                size="sm"
                onClick={editThisVersion}
                isLoading={openForEditing.isPending}
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit as new draft
              </Button>
            ) : (
              <Button size="sm" onClick={save} isLoading={isSaving} disabled={!isDirty}>
                <Save className="h-3.5 w-3.5" />
                Save proposal
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* A locked version is shown, not edited — the way forward is a fork. */}
      {isLocked ? (
        <div
          role="note"
          className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-warning/25 bg-warning-subtle px-4 py-3 text-xs leading-relaxed text-warning"
        >
          <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span>
            V{proposal.versionNumber} is <strong>{proposal.status.toLowerCase()}</strong> and
            read-only, so the record of what existed at this point is preserved.
            Choose <strong>Edit as new draft</strong> to continue working — a copy
            becomes V{(versions?.summary.latest?.versionNumber ?? proposal.versionNumber) + 1}.
          </span>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5"
        >
        {/*
          One fieldset makes every control below read-only when the version is
          locked — native, so no editor component needs a `disabled` prop and no
          new control can accidentally miss the rule. `contents` keeps the flex
          layout exactly as it was.
        */}
        <fieldset disabled={isLocked} className="contents">
        {/* 1 — Client Information (read-only) */}
        <ProposalClientInfo lead={lead} />

        {/* 2 — Project Estimate (editable; prefilled from the lead's snapshot) */}
        <ProposalProjectEstimate
          value={draft.projectEstimate ?? deriveProposalEstimate(lead)}
          onChange={(projectEstimate) => patch({ projectEstimate })}
        />

        {/* Title sits with the executive summary rather than in its own section. */}
        {/* 3 — Executive Summary */}
        <WorkspaceSection
          id="executive-summary"
          icon={FileSignature}
          title="Executive Summary"
          description="Opening statement the client reads first"
        >
          <div className="flex flex-col gap-4">
            <Input
              label="Proposal title"
              value={draft.title}
              onChange={(event) => patch({ title: event.target.value })}
              error={draft.title.trim().length === 0 ? "Title is required" : undefined}
            />
            <MarkdownField
              label="Summary"
              value={draft.executiveSummary}
              onChange={(executiveSummary) => patch({ executiveSummary })}
              rows={10}
            />
          </div>
        </WorkspaceSection>

        {/* 3 — Project Scope */}
        <WorkspaceSection
          id="project-scope"
          icon={Target}
          title="Project Scope"
          description="What the engagement covers, and what it produces"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <ListField
              label="Scope of work"
              value={draft.scopeOfWork}
              onChange={(scopeOfWork) => patch({ scopeOfWork })}
              rows={10}
              placeholder="One scope item per line"
            />
            <ListField
              label="Deliverables"
              value={draft.deliverables}
              onChange={(deliverables) => patch({ deliverables })}
              rows={10}
              placeholder="One deliverable per line"
            />
          </div>
        </WorkspaceSection>

        {/* 4 — Features */}
        <ProposalFeaturesEditor
          features={draft.features}
          onChange={(features) => patch({ features })}
        />

        {/* 5 — Timeline */}
        <WorkspaceSection
          id="timeline"
          icon={CalendarRange}
          title="Timeline"
          description="Duration and indicative phasing"
        >
          <MarkdownField
            value={draft.timeline}
            onChange={(timeline) => patch({ timeline })}
            rows={8}
          />
        </WorkspaceSection>

        {/* 6 — Team Structure */}
        <WorkspaceSection
          id="team-structure"
          icon={Users}
          title="Team Structure"
          description="Roles and staffing for the engagement"
        >
          <MarkdownField
            value={draft.teamStructure}
            onChange={(teamStructure) => patch({ teamStructure })}
            rows={8}
          />
        </WorkspaceSection>

        {/* 7 — Assumptions */}
        <WorkspaceSection
          id="assumptions"
          icon={Lightbulb}
          title="Assumptions"
          description="Conditions this proposal depends on"
        >
          <MarkdownField
            value={draft.assumptions}
            onChange={(assumptions) => patch({ assumptions })}
            rows={7}
            hint="Prefilled from the estimate's assumptions."
          />
        </WorkspaceSection>

        {/* 8 — Risks */}
        <WorkspaceSection
          id="risks"
          icon={AlertTriangle}
          title="Risks"
          description="Known delivery risks to flag to the client"
        >
          <ListField
            value={draft.risks}
            onChange={(risks) => patch({ risks })}
            rows={7}
            placeholder="One risk per line"
          />
        </WorkspaceSection>

        {/* 9 — Commercial Summary */}
        <WorkspaceSection
          id="commercial-summary"
          icon={Wallet}
          title="Commercial Summary"
          description="Pricing and payment basis"
          actions={
            <Badge variant="info" size="sm">
              Prefilled from estimate
            </Badge>
          }
        >
          <MarkdownField
            value={draft.pricingNotes}
            onChange={(pricingNotes) => patch({ pricingNotes })}
            rows={8}
            hint="Prefilled from the client's estimate snapshot. Refine payment terms and discounts before sharing."
          />
        </WorkspaceSection>

        {/* 10 — Terms & Conditions */}
        <WorkspaceSection
          id="terms"
          icon={ScrollText}
          title="Terms & Conditions"
          description="Contractual terms attached to this proposal"
        >
          <MarkdownField
            value={draft.termsAndConditions}
            onChange={(termsAndConditions) => patch({ termsAndConditions })}
            rows={10}
          />
        </WorkspaceSection>
        </fieldset>
        </motion.div>

        {/* Sticky so history stays reachable while scrolling a long proposal. */}
        <div className="xl:sticky xl:top-36 xl:self-start">
          <ProposalVersionHistory
            versions={versions?.items ?? []}
            currentId={proposal.id}
            onSelect={(version) => openVersion(version.id)}
            isLoading={isLoadingVersions}
          />
        </div>
      </div>
    </div>
  );
}
