import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  FileSearch,
  FileSignature,
  Gauge,
  Lightbulb,
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
import { DownloadProposalMenu } from "@/features/proposal-editor/components/download-proposal-menu";
import { ListField } from "@/features/proposal-editor/components/list-field";
import { MarkdownField } from "@/features/proposal-editor/components/markdown-field";
import { ProposalClientInfo } from "@/features/proposal-editor/components/proposal-client-info";
import { ProposalFeaturesEditor } from "@/features/proposal-editor/components/proposal-features-editor";
import { ProposalEditorSkeleton } from "@/features/proposal-editor/components/proposal-editor-skeleton";
import { useExportProposal } from "@/features/proposal-editor/hooks/use-export-proposal";
import { useLeadProposal } from "@/features/proposal-editor/hooks/use-lead-proposal";
import { formatRelativeTime } from "@/utils/format";
import { staggerContainer } from "@/utils/motion";

/**
 * Proposal Editor — a single-page workspace for drafting a client proposal.
 *
 * Prefilled from the lead's requirement summary, detected features and
 * estimate. Drafts are saved to this browser only; see proposal-draft.store.ts
 * for why server persistence is blocked without a schema change.
 */
export function ProposalEditorPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, isError, error, refetch } = useClientLead(leadId);
  const {
    draft,
    patch,
    isDirty,
    save,
    isSaving,
    savedAt,
    reset,
    regenerateFromLead,
  } = useLeadProposal(lead);
  const { runExport, exportingFormat } = useExportProposal();

  const backToLead = () => navigate(`/client-requests/${leadId}`);

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

  if (isNotFound) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Request not found"
        description="This client request doesn't exist, so a proposal can't be drafted for it."
        action={
          <Button variant="secondary" onClick={() => navigate("/client-requests")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Client Requests
          </Button>
        }
      />
    );
  }

  if (isError || !lead || !draft) {
    return (
      <div>
        <div className="mb-5">
          <Button variant="ghost" size="sm" onClick={backToLead}>
            <ArrowLeft className="h-4 w-4" />
            Back to Lead Details
          </Button>
        </div>
        <SectionError
          message="Couldn't load this client request."
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
                Proposal Editor
              </p>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {lead.company ?? lead.name}
                </h1>
                <Badge variant="default" size="sm">
                  {draft.status}
                </Badge>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerateFromLead}
              title="Rebuild every section from the request's summary, features and estimate"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Rebuild from request
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
            <Button size="sm" onClick={save} isLoading={isSaving} disabled={!isDirty}>
              <Save className="h-3.5 w-3.5" />
              Save proposal
            </Button>
          </div>
        </div>
      </div>

      {/* Storage caveat stated up front, not buried — an admin should know
          before investing effort that this draft is browser-local. */}
      <div
        role="note"
        className="mb-5 rounded-xl border border-warning/25 bg-warning-subtle px-4 py-3 text-xs leading-relaxed text-warning"
      >
        Proposal drafts are saved to <strong>this browser only</strong> and are not
        yet stored on the server — they aren't visible to teammates and will be lost
        if you clear site data. Server persistence needs a database change, which is
        out of scope for this sprint.
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5"
      >
        {/* 1 — Client Information (read-only) */}
        <ProposalClientInfo lead={lead} />

        {/* Title sits with the executive summary rather than in its own section. */}
        {/* 2 — Executive Summary */}
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
            <Badge variant="warning" size="sm">
              Needs completion
            </Badge>
          }
        >
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-canvas px-3.5 py-2.5">
            <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-muted" strokeWidth={1.85} />
            <p className="text-xs leading-relaxed text-muted">
              No rate card exists in the system yet (Cost Settings is not built), so
              no figures are pre-filled here — only the effort basis from the
              estimate. Add pricing manually before sharing.
            </p>
          </div>
          <MarkdownField
            value={draft.pricingNotes}
            onChange={(pricingNotes) => patch({ pricingNotes })}
            rows={8}
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
      </motion.div>
    </div>
  );
}
