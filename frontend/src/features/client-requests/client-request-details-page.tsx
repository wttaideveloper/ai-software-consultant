import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, FileSearch, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionError } from "@/components/shared/section-error";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientLeadStatusBadge } from "@/features/client-requests/components/client-lead-status-badge";
import { LeadActivityTimeline } from "@/features/client-requests/components/lead-activity-timeline";
import { LeadClientInfoCard } from "@/features/client-requests/components/lead-client-info-card";
import { LeadDetailsSkeleton } from "@/features/client-requests/components/lead-details-skeleton";
import { LeadEstimateSection } from "@/features/client-requests/components/lead-estimate-section";
import { LeadFeaturesSection } from "@/features/client-requests/components/lead-features-section";
import { LeadNotesSection } from "@/features/client-requests/components/lead-notes-section";
import { LeadStatusModal } from "@/features/client-requests/components/lead-status-modal";
import { LeadSummarySection } from "@/features/client-requests/components/lead-summary-section";
import { useClientLead } from "@/features/client-requests/hooks/use-client-lead";
import { useUpdateClientLead } from "@/features/client-requests/hooks/use-update-client-lead";
import { LeadProposalVersionsSection } from "@/features/lead-proposals/components/lead-proposal-versions-section";
import { useLeadProposalVersions } from "@/features/lead-proposals/hooks/use-lead-proposals";
import { buildProposalDraft } from "@/features/proposal-editor/build-proposal-draft";
import { DownloadProposalMenu } from "@/features/proposal-editor/components/download-proposal-menu";
import { useExportProposal } from "@/features/proposal-editor/hooks/use-export-proposal";
import { toDraft } from "@/features/proposal-editor/lead-proposal.types";
import { leadProposalsService } from "@/services/lead-proposals.service";
import type { ClientLeadFeature, ClientLeadStatus } from "@/types";
import { staggerContainer } from "@/utils/motion";

const BACK_PATH = "/client-requests";

/**
 * Lead Details Workspace — the sales team's primary screen.
 *
 * Every section lives on this one page by design: an admin working a lead needs
 * the summary, features and estimate visible together while they talk to the
 * client, so nothing here is split across routes.
 */
export function ClientRequestDetailsPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const { data: lead, isLoading, isError, error, refetch } = useClientLead(leadId);
  const updateLead = useUpdateClientLead();
  const { runExport, exportingFormat } = useExportProposal();
  const { data: versions } = useLeadProposalVersions(leadId);

  const goBack = () => navigate(BACK_PATH);

  const isNotFound = isAxiosError(error) && error.response?.status === 404;

  // ---- Loading -----------------------------------------------------------
  if (isLoading) {
    return (
      <div>
        <div className="mb-5 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Client Requests
          </Button>
        </div>
        <LeadDetailsSkeleton />
      </div>
    );
  }

  // ---- Not found (distinct from a transport failure) ---------------------
  if (isNotFound) {
    return (
      <div>
        <EmptyState
          icon={FileSearch}
          title="Request not found"
          description="This client request doesn't exist, or it has been deleted."
          action={
            <Button variant="secondary" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to Client Requests
            </Button>
          }
        />
      </div>
    );
  }

  // ---- Error -------------------------------------------------------------
  if (isError || !lead) {
    return (
      <div>
        <div className="mb-5">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Client Requests
          </Button>
        </div>
        <SectionError
          message="Couldn't load this client request."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const saveSummary = (requirementSummary: string) =>
    updateLead.mutate({
      leadId: lead.id,
      payload: { requirementSummary },
      successMessage: "Requirement summary saved.",
    });

  const saveFeatures = (features: ClientLeadFeature[]) =>
    updateLead.mutate({
      leadId: lead.id,
      payload: { features },
      successMessage: "Features saved.",
    });

  /**
   * The version a header export should produce: whatever is currently with the
   * client, else the newest draft, else a prefill built from the request.
   */
  const exportHeadlineProposal = async (format: "pdf" | "docx") => {
    // What the client last saw, else the newest version, else a fresh prefill.
    const headline =
      versions?.summary.clientVersion ?? versions?.summary.latest ?? null;

    if (!headline) {
      await runExport(format, { draft: buildProposalDraft(lead), lead });
      return;
    }

    const detail = await leadProposalsService.getById(headline.id);
    await runExport(format, {
      draft: toDraft(detail.title, detail.content),
      lead,
    });
  };

  const saveStatus = (status: ClientLeadStatus) =>
    updateLead.mutate(
      {
        leadId: lead.id,
        payload: { status },
        successMessage: "Status updated.",
      },
      { onSuccess: () => setStatusModalOpen(false) },
    );

  return (
    <div className="pb-4">
      {/*
        Sticky workspace header. `top-16` clears the app Navbar (h-16, sticky
        top-0); the negative insets let the frosted bar span the main region's
        horizontal padding instead of floating inside it.
      */}
      <div className="asc-glass sticky top-16 z-20 -mx-4 mb-5 border-b border-border px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goBack}
              aria-label="Back to Client Requests"
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wider text-accent-text uppercase">
                Client Request
              </p>
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {lead.name}
                </h1>
                <ClientLeadStatusBadge status={lead.status} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStatusModalOpen(true)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Edit Status
            </Button>
            {/*
              Header export is a shortcut for "give me the proposal for this
              client": it exports the active version, falling back to the latest,
              and generates a fresh prefill only when no version exists at all —
              so an admin can download something usable without opening a version
              first. Per-version export lives in the Proposal Versions section.
            */}
            <DownloadProposalMenu
              onSelect={(format) => void exportHeadlineProposal(format)}
              exportingFormat={exportingFormat}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="hidden sm:inline-flex"
            >
              Back to Client Requests
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5"
      >
        <LeadClientInfoCard lead={lead} />

        <LeadSummarySection
          summary={lead.requirementSummary}
          onSave={saveSummary}
          isSaving={updateLead.isPending}
        />

        <LeadFeaturesSection
          features={lead.features}
          onSave={saveFeatures}
          isSaving={updateLead.isPending}
        />

        <LeadEstimateSection
          estimate={lead.estimate}
          techStack={lead.techStack}
          pricing={lead.pricing}
        />

        <LeadProposalVersionsSection lead={lead} />

        <LeadNotesSection />

        <LeadActivityTimeline lead={lead} />
      </motion.div>

      <LeadStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        currentStatus={lead.status}
        onConfirm={saveStatus}
        isSaving={updateLead.isPending}
      />
    </div>
  );
}
