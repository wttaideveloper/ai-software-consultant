import { Calculator, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { EstimateSavingsSummary } from "@/client-portal/estimate/components/estimate-savings-summary";
import { FeatureBreakdownRow } from "@/client-portal/estimate/components/feature-breakdown-row";
import { MetricCard } from "@/client-portal/estimate/components/metric-card";
import { ProjectCostCard } from "@/client-portal/estimate/components/project-cost-card";
import {
  TIMELINE_RANGE_HELPER_TEXT,
  formatWeekRange,
  resolveWizardPlatformLabels,
  toWeekRange,
} from "@/client-portal/estimate/estimate-pricing";
import { useClientEstimatePrice } from "@/client-portal/estimate/hooks/use-client-estimate-price";
import { useGenerateClientEstimate } from "@/client-portal/estimate/hooks/use-generate-client-estimate";
import { AiGenerationLoader } from "@/client-portal/components/ai-generation-loader";
import { Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { Gauge, Layers, Sparkles, Wallet } from "lucide-react";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/**
 * Auto-generates on first visit only (guarded by `!estimate`), same reasoning as the
 * Summary and Features steps — always-regenerating on remount would silently discard
 * "included" toggles and any other client interaction with the estimate.
 */
export function ClientEstimatePage() {
  const navigate = useNavigate();

  const features = useClientConsultationStore((state) => state.features);
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore(
    (state) => state.otherPlatform,
  );
  const estimate = useClientConsultationStore((state) => state.estimate);
  const complexity = useClientConsultationStore((state) => state.complexity);
  const recommendedTeam = useClientConsultationStore(
    (state) => state.recommendedTeam,
  );
  const techStack = useClientConsultationStore((state) => state.techStack);
  const pricing = useClientConsultationStore((state) => state.pricing);
  const featureBreakdown = useClientConsultationStore(
    (state) => state.featureBreakdown,
  );
  const toggleFeatureIncluded = useClientConsultationStore(
    (state) => state.toggleFeatureIncluded,
  );
  const setCurrentPricing = useClientConsultationStore(
    (state) => state.setCurrentPricing,
  );

  const generateEstimate = useGenerateClientEstimate();
  const hasGeneratedRef = useRef(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);

  const platformLabels = useMemo(
    () => resolveWizardPlatformLabels(platforms, otherPlatform),
    [platforms, otherPlatform],
  );

  /** Effort of the features still switched on — the input the live reprice keys on. */
  const currentHours = useMemo(
    () =>
      featureBreakdown.reduce(
        (total, item) => (item.included ? total + item.hours : total),
        0,
      ),
    [featureBreakdown],
  );

  const originalHours = estimate?.estimatedHours ?? 0;

  /**
   * Repricing is only offered once generation proved the rate card works. When the
   * first estimate came back unpriced, the card stays an honest "not available"
   * rather than firing a request per toggle that is already known to fail.
   */
  const canReprice = pricing !== null && complexity !== null;

  const priceQuery = useClientEstimatePrice(
    {
      estimatedHours: currentHours,
      complexity: complexity ?? "MEDIUM",
      platforms: platformLabels,
    },
    canReprice,
  );

  // Falls back to the generation-time price until the first reprice resolves, so
  // the card always has a figure to show. With everything switched off there is no
  // scope to price — the last known price would be actively misleading there.
  const currentPricing = currentHours > 0 ? (priceQuery.data ?? pricing) : null;

  /**
   * Publishes the figure this page is showing to the shared consultation state, so
   * the Proposal step can present the client's *current* price without repricing.
   * Writing the derived value (rather than the raw query result) is what keeps the
   * two screens identical, including the "everything switched off" case.
   */
  useEffect(() => {
    setCurrentPricing(currentPricing);
  }, [currentPricing, setCurrentPricing]);

  const timelineDisplay = estimate
    ? formatWeekRange(toWeekRange(estimate.estimatedWeeks))
    : "—";

  const requestGeneration = () => {
    if (features.length === 0) return;
    generateEstimate.mutate({
      features: features.map(
        ({
          name,
          category,
          description,
          priority,
          complexity: featureComplexity,
        }) => ({
          name,
          category,
          description,
          priority,
          complexity: featureComplexity,
        }),
      ),
      // Wizard-selected platforms drive the Cost Engine's platform premium; the AI
      // is only asked for effort. Same labels the live reprice uses, so generation
      // and every subsequent toggle price against identical platforms.
      platforms: platformLabels,
    });
  };

  useEffect(() => {
    if (hasGeneratedRef.current || estimate || features.length === 0) {
      return;
    }
    hasGeneratedRef.current = true;
    requestGeneration();
    // Intentionally runs once on first visit only — see the guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = () => {
    setIsRegenerateConfirmOpen(false);
    requestGeneration();
  };

  const isLoading = generateEstimate.isPending && !estimate;

  if (features.length === 0 && !estimate) {
    return (
      <ClientLayout>
        <EmptyState
          icon={Calculator}
          title="No features yet"
          description="Detected features are needed before a project estimate can be generated."
          action={
            <Button onClick={() => navigate("/features")}>
              Go to features
            </Button>
          }
        />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Project Estimate
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Generated from your feature list. Toggle features off and your
          estimated cost updates instantly.
        </p>

        <div className="mt-6">
          {isLoading ? (
            <AiGenerationLoader
              title="Estimating your project investment…"
              caption="Pricing your features against our rate card."
              steps={[
                { icon: Layers, label: "Reviewing your feature list" },
                { icon: Gauge, label: "Calculating project complexity" },
                { icon: Wallet, label: "Estimating project investment" },
                { icon: Sparkles, label: "Finalizing your estimate" },
              ]}
            />
          ) : null}

          {!isLoading && generateEstimate.isError && !estimate ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted">
                Something went wrong generating the estimate.
              </p>
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-hover"
                onClick={requestGeneration}
              >
                Try again
              </button>
            </div>
          ) : null}

          {estimate ? (
            <div className="flex flex-col gap-8">
              <ProjectCostCard
                pricing={currentPricing}
                isUpdating={canReprice && priceQuery.isFetching}
                noFeaturesSelected={
                  featureBreakdown.length > 0 && currentHours === 0
                }
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                  label="Timeline"
                  value={timelineDisplay}
                  hint={TIMELINE_RANGE_HELPER_TEXT}
                />
                <MetricCard label="Complexity" value={complexity ?? "—"} />
                <MetricCard
                  label="Recommended Team"
                  value={
                    recommendedTeam
                      ? `${recommendedTeam} member${recommendedTeam === 1 ? "" : "s"}`
                      : "—"
                  }
                />
                <MetricCard
                  label="Technology Stack"
                  value={
                    techStack && techStack.length > 0
                      ? techStack.join(", ")
                      : "Not available"
                  }
                  unavailable={!techStack || techStack.length === 0}
                />
              </div>

              <EstimateSavingsSummary
                originalHours={originalHours}
                currentHours={currentHours}
                originalPricing={pricing}
                currentPricing={currentPricing}
              />

              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">
                  Feature Breakdown
                </h2>
                <div className="mt-3 flex flex-col gap-2">
                  {featureBreakdown.map((item) => (
                    <FeatureBreakdownRow
                      key={item.featureId}
                      item={item}
                      onToggleIncluded={() =>
                        toggleFeatureIncluded(item.featureId)
                      }
                    />
                  ))}
                </div>
              </div>

              {estimate.assumptions.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">
                    Assumptions
                  </h2>
                  <ul className="mt-3 flex flex-col gap-1.5 text-sm text-foreground-soft">
                    {estimate.assumptions.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-muted">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {estimate.risks.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">
                    Risks
                  </h2>
                  <ul className="mt-3 flex flex-col gap-1.5 text-sm text-foreground-soft">
                    {estimate.risks.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-muted">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/*
          Concept mockups are deliberately NOT on this page: they live on the
          /mockups step that follows, so image generation can never delay, block
          or share state with the estimate. See client-mockups-page.tsx.
        */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/features")}
          >
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => navigate("/mockups")}
              disabled={!estimate}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isRegenerateConfirmOpen}
        onClose={() => setIsRegenerateConfirmOpen(false)}
        onConfirm={handleRegenerate}
        title="Regenerate estimate?"
        description="This replaces the current estimate with a fresh one from the AI. Your Included toggles are kept where the same features still exist."
        confirmLabel="Regenerate"
        tone="primary"
        isLoading={generateEstimate.isPending}
      />
    </ClientLayout>
  );
}
