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
import { EstimationDocument } from "@/features/estimation/components/estimation-document";
import { EstimationEditor } from "@/features/estimation/components/estimation-editor";
import { EstimationEmptyState } from "@/features/estimation/components/estimation-empty-state";
import { EstimationHeader } from "@/features/estimation/components/estimation-header";
import { EstimationSkeleton } from "@/features/estimation/components/estimation-skeleton";
import {
  estimationEditSchema,
  estimationToFormValues,
  formValuesToEstimationPayload,
  type EstimationEditValues,
} from "@/features/estimation/estimation.schema";
import { useEstimation } from "@/features/estimation/hooks/use-estimation";
import { useGenerateEstimation } from "@/features/estimation/hooks/use-generate-estimation";
import { useUpdateEstimation } from "@/features/estimation/hooks/use-update-estimation";
import type { Consultation } from "@/types";
import { fadeIn } from "@/utils/motion";

const EMPTY_EDIT_VALUES: EstimationEditValues = {
  estimatedHours: 0,
  estimatedWeeks: 0,
  estimatedTeamSize: 0,
  assumptions: "",
  risks: "",
  breakdown: [{ category: "", hours: 0 }],
};

export function EstimationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedId = searchParams.get("id");

  const [lastClicked, setLastClicked] = useState<Consultation | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: selectedConsultation } = useConsultation(selectedId, lastClicked ?? undefined);
  const {
    data: estimation,
    isLoading: isLoadingEstimation,
    isError: isErrorEstimation,
    refetch: refetchEstimation,
  } = useEstimation(selectedId);

  const generateEstimation = useGenerateEstimation(selectedId ?? "");
  const updateEstimation = useUpdateEstimation(selectedId ?? "");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EstimationEditValues>({
    resolver: zodResolver(estimationEditSchema),
    defaultValues: EMPTY_EDIT_VALUES,
  });

  useEffect(() => {
    if (isEditing && estimation) {
      reset(estimationToFormValues(estimation));
    }
  }, [isEditing, estimation, reset]);

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
    generateEstimation.mutate(undefined, { onSuccess: () => setIsEditing(false) });
  };

  const handleSave = handleSubmit((values) => {
    updateEstimation.mutate(formValuesToEstimationPayload(values), {
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
            description="Choose a consultation from the list to view or generate its project estimation."
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
            <EstimationHeader
              consultationTitle={selectedConsultation?.title ?? "…"}
              estimation={estimation ?? null}
              isEditing={isEditing}
              isGenerating={generateEstimation.isPending}
              isSaving={updateEstimation.isPending}
              onGenerate={handleGenerate}
              onEdit={() => setIsEditing(true)}
              onSave={() => void handleSave()}
              onCancelEdit={() => setIsEditing(false)}
            />

            <div className="relative flex-1 overflow-y-auto">
              <AnimatePresence>
                {generateEstimation.isPending ? (
                  <ProcessingOverlay message="Generating estimation…" />
                ) : null}
              </AnimatePresence>

              {isErrorEstimation ? (
                <div className="flex flex-1 items-center justify-center p-6">
                  <SectionError
                    message="Couldn't load the estimation."
                    onRetry={refetchEstimation}
                  />
                </div>
              ) : isLoadingEstimation ? (
                <EstimationSkeleton />
              ) : !estimation ? (
                <EstimationEmptyState
                  onGenerate={handleGenerate}
                  isGenerating={generateEstimation.isPending}
                />
              ) : isEditing ? (
                <EstimationEditor register={register} control={control} errors={errors} />
              ) : (
                <EstimationDocument estimation={estimation} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </SplitWorkspaceLayout>
  );
}
