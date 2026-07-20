import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProcessingOverlay } from "@/components/shared/processing-overlay";
import { SectionError } from "@/components/shared/section-error";
import { SplitWorkspaceLayout } from "@/components/shared/split-workspace-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { ConsultationListPanel } from "@/features/consultations/components/consultation-list-panel";
import { useConsultation } from "@/features/consultations/hooks/use-consultation";
import { ProposalDocument } from "@/features/proposal/components/proposal-document";
import { ProposalEditor } from "@/features/proposal/components/proposal-editor";
import { ProposalEmptyState } from "@/features/proposal/components/proposal-empty-state";
import { ProposalHeader } from "@/features/proposal/components/proposal-header";
import { ProposalSkeleton } from "@/features/proposal/components/proposal-skeleton";
import { useGenerateProposal } from "@/features/proposal/hooks/use-generate-proposal";
import { useProposal } from "@/features/proposal/hooks/use-proposal";
import { useUpdateProposal } from "@/features/proposal/hooks/use-update-proposal";
import {
  formValuesToProposalPayload,
  proposalEditSchema,
  proposalToFormValues,
  type ProposalEditValues,
} from "@/features/proposal/proposal.schema";
import type { Consultation } from "@/types";
import { fadeIn } from "@/utils/motion";

const EMPTY_EDIT_VALUES: ProposalEditValues = {
  title: "",
  executiveSummary: "",
  scopeOfWork: "",
  deliverables: "",
  timeline: "",
  assumptions: "",
  exclusions: "",
  pricingNotes: "",
  proposalMarkdown: "",
  status: "DRAFT",
};

export function ProposalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedId = searchParams.get("id");

  const [lastClicked, setLastClicked] = useState<Consultation | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: selectedConsultation } = useConsultation(selectedId, lastClicked ?? undefined);
  const {
    data: proposal,
    isLoading: isLoadingProposal,
    isError: isErrorProposal,
    refetch: refetchProposal,
  } = useProposal(selectedId);

  const generateProposal = useGenerateProposal(selectedId ?? "");
  const updateProposal = useUpdateProposal(selectedId ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProposalEditValues>({
    resolver: zodResolver(proposalEditSchema),
    defaultValues: EMPTY_EDIT_VALUES,
  });

  useEffect(() => {
    if (isEditing && proposal) {
      reset(proposalToFormValues(proposal));
    }
  }, [isEditing, proposal, reset]);

  const selectConsultation = useCallback(
    (consultation: Consultation) => {
      setLastClicked(consultation);
      setIsEditing(false);
      setSearchParams((params) => {
        params.set("id", consultation.id);
        return params;
      });
    },
    [setSearchParams],
  );

  const handleGenerate = () => {
    generateProposal.mutate(undefined, { onSuccess: () => setIsEditing(false) });
  };

  const handleSave = handleSubmit((values) => {
    updateProposal.mutate(formValuesToProposalPayload(values), {
      onSuccess: () => setIsEditing(false),
    });
  });

  const listPanel = (
    <ConsultationListPanel
      selectedId={selectedId}
      onSelect={selectConsultation}
      onCreate={() => navigate("/consultations")}
    />
  );

  return (
    <SplitWorkspaceLayout listPanel={listPanel} drawerTitle="Consultations">
      {!selectedId ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            icon={Sparkles}
            title="Select a consultation"
            description="Choose a consultation from the list to view or generate its project proposal."
          />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex min-h-0 flex-1 flex-col"
          >
            <ProposalHeader
              consultationTitle={selectedConsultation?.title ?? "…"}
              proposal={proposal ?? null}
              isEditing={isEditing}
              isGenerating={generateProposal.isPending}
              isSaving={updateProposal.isPending}
              onGenerate={handleGenerate}
              onEdit={() => setIsEditing(true)}
              onSave={() => void handleSave()}
              onCancelEdit={() => setIsEditing(false)}
            />

            <div className="relative flex-1 overflow-y-auto">
              <AnimatePresence>
                {generateProposal.isPending ? (
                  <ProcessingOverlay message="Generating proposal…" />
                ) : null}
              </AnimatePresence>

              {isErrorProposal ? (
                <div className="flex flex-1 items-center justify-center p-6">
                  <SectionError message="Couldn't load the proposal." onRetry={refetchProposal} />
                </div>
              ) : isLoadingProposal ? (
                <ProposalSkeleton />
              ) : !proposal ? (
                <ProposalEmptyState
                  onGenerate={handleGenerate}
                  isGenerating={generateProposal.isPending}
                />
              ) : isEditing ? (
                <ProposalEditor register={register} errors={errors} />
              ) : (
                <ProposalDocument proposal={proposal} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </SplitWorkspaceLayout>
  );
}
