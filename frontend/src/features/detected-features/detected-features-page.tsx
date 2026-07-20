import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SectionError } from "@/components/shared/section-error";
import { SplitWorkspaceLayout } from "@/components/shared/split-workspace-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { ConsultationListPanel } from "@/features/consultations/components/consultation-list-panel";
import { useConsultation } from "@/features/consultations/hooks/use-consultation";
import { DetectedFeaturesEmptyState } from "@/features/detected-features/components/detected-features-empty-state";
import { DetectedFeaturesGroups } from "@/features/detected-features/components/detected-features-groups";
import { DetectedFeaturesHeader } from "@/features/detected-features/components/detected-features-header";
import { DetectedFeaturesLoadingOverlay } from "@/features/detected-features/components/detected-features-loading-overlay";
import { DetectedFeaturesSkeleton } from "@/features/detected-features/components/detected-features-skeleton";
import { useDetectFeatures } from "@/features/detected-features/hooks/use-detect-features";
import { useDetectedFeatures } from "@/features/detected-features/hooks/use-detected-features";
import type { Consultation } from "@/types";
import { fadeIn } from "@/utils/motion";

export function DetectedFeaturesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedId = searchParams.get("id");

  const [lastClicked, setLastClicked] = useState<Consultation | null>(null);

  const { data: selectedConsultation } = useConsultation(selectedId, lastClicked ?? undefined);
  const {
    data: featuresResponse,
    isLoading,
    isError,
    refetch,
  } = useDetectedFeatures(selectedId);

  const detectFeatures = useDetectFeatures(selectedId ?? "");

  const selectConsultation = useCallback(
    (consultation: Consultation) => {
      setLastClicked(consultation);
      setSearchParams((params) => {
        params.set("id", consultation.id);
        return params;
      });
    },
    [setSearchParams],
  );

  const handleDetect = () => {
    detectFeatures.mutate();
  };

  const listPanel = (
    <ConsultationListPanel
      selectedId={selectedId}
      onSelect={selectConsultation}
      onCreate={() => navigate("/consultations")}
    />
  );

  const groups = featuresResponse?.groups ?? [];
  const totalFeatures = featuresResponse?.total ?? 0;
  const verifiedCount = groups.reduce(
    (count, group) => count + group.features.filter((feature) => feature.manuallyVerified).length,
    0,
  );
  const lastUpdated = groups.flatMap((group) => group.features).reduce<string | null>(
    (latest, feature) =>
      !latest || new Date(feature.updatedAt) > new Date(latest) ? feature.updatedAt : latest,
    null,
  );

  return (
    <SplitWorkspaceLayout listPanel={listPanel} drawerTitle="Consultations">
      {!selectedId ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            icon={Sparkles}
            title="Select a consultation"
            description="Choose a consultation from the list to view or detect its features."
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
            <DetectedFeaturesHeader
              consultationTitle={selectedConsultation?.title ?? "…"}
              totalFeatures={totalFeatures}
              verifiedCount={verifiedCount}
              lastUpdated={lastUpdated}
              hasFeatures={groups.length > 0}
              isDetecting={detectFeatures.isPending}
              onDetect={handleDetect}
            />

            <div className="relative flex-1 overflow-y-auto">
              <AnimatePresence>
                {detectFeatures.isPending ? <DetectedFeaturesLoadingOverlay /> : null}
              </AnimatePresence>

              {isError ? (
                <div className="flex flex-1 items-center justify-center p-6">
                  <SectionError message="Couldn't load detected features." onRetry={refetch} />
                </div>
              ) : isLoading ? (
                <DetectedFeaturesSkeleton />
              ) : groups.length === 0 ? (
                <DetectedFeaturesEmptyState
                  onDetect={handleDetect}
                  isDetecting={detectFeatures.isPending}
                />
              ) : (
                <DetectedFeaturesGroups groups={groups} consultationId={selectedId} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </SplitWorkspaceLayout>
  );
}
