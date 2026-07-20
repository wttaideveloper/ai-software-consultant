import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SectionError } from "@/components/shared/section-error";
import { SplitWorkspaceLayout } from "@/components/shared/split-workspace-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { ConsultationListPanel } from "@/features/consultations/components/consultation-list-panel";
import { useConsultation } from "@/features/consultations/hooks/use-consultation";
import { RequirementSummaryDocument } from "@/features/requirement-summary/components/requirement-summary-document";
import { RequirementSummaryEditor } from "@/features/requirement-summary/components/requirement-summary-editor";
import { RequirementSummaryEmptyState } from "@/features/requirement-summary/components/requirement-summary-empty-state";
import { RequirementSummaryHeader } from "@/features/requirement-summary/components/requirement-summary-header";
import { RequirementSummarySkeleton } from "@/features/requirement-summary/components/requirement-summary-skeleton";
import { useGenerateRequirementSummary } from "@/features/requirement-summary/hooks/use-generate-requirement-summary";
import { useRequirementSummary } from "@/features/requirement-summary/hooks/use-requirement-summary";
import { useUpdateRequirementSummary } from "@/features/requirement-summary/hooks/use-update-requirement-summary";
import {
  EMPTY_EDIT_VALUES,
  formValuesToPayload,
  requirementSummaryEditSchema,
  summaryToFormValues,
  type RequirementSummaryEditValues,
} from "@/features/requirement-summary/requirement-summary.schema";
import type { Consultation } from "@/types";
import { fadeIn } from "@/utils/motion";

export function RequirementSummaryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedId = searchParams.get("id");

  const [lastClicked, setLastClicked] = useState<Consultation | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: selectedConsultation } = useConsultation(selectedId, lastClicked ?? undefined);
  const {
    data: summary,
    isLoading: isLoadingSummary,
    isError: isErrorSummary,
    refetch: refetchSummary,
  } = useRequirementSummary(selectedId);

  const generateSummary = useGenerateRequirementSummary(selectedId ?? "");
  const updateSummary = useUpdateRequirementSummary(selectedId ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequirementSummaryEditValues>({
    resolver: zodResolver(requirementSummaryEditSchema),
    defaultValues: EMPTY_EDIT_VALUES,
  });

  useEffect(() => {
    if (isEditing && summary) {
      reset(summaryToFormValues(summary));
    }
  }, [isEditing, summary, reset]);

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
    generateSummary.mutate(undefined, { onSuccess: () => setIsEditing(false) });
  };

  const handleSave = handleSubmit((values) => {
    updateSummary.mutate(formValuesToPayload(values), { onSuccess: () => setIsEditing(false) });
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
            description="Choose a consultation from the list to view or generate its requirement summary."
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
            <RequirementSummaryHeader
              consultationTitle={selectedConsultation?.title ?? summary?.consultation.title ?? "…"}
              summary={summary ?? null}
              isEditing={isEditing}
              isGenerating={generateSummary.isPending}
              isSaving={updateSummary.isPending}
              onGenerate={handleGenerate}
              onEdit={() => setIsEditing(true)}
              onSave={() => void handleSave()}
              onCancelEdit={() => setIsEditing(false)}
            />

            <div className="flex-1 overflow-y-auto">
              {isErrorSummary ? (
                <div className="flex flex-1 items-center justify-center p-6">
                  <SectionError
                    message="Couldn't load the requirement summary."
                    onRetry={refetchSummary}
                  />
                </div>
              ) : isLoadingSummary ? (
                <RequirementSummarySkeleton />
              ) : !summary ? (
                <RequirementSummaryEmptyState
                  onGenerate={handleGenerate}
                  isGenerating={generateSummary.isPending}
                />
              ) : isEditing ? (
                <RequirementSummaryEditor register={register} errors={errors} />
              ) : (
                <RequirementSummaryDocument summary={summary} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </SplitWorkspaceLayout>
  );
}
