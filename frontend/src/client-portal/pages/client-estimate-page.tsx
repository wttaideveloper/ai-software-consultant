import { Calculator, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { FeatureBreakdownRow } from "@/client-portal/estimate/components/feature-breakdown-row";
import { MetricCard } from "@/client-portal/estimate/components/metric-card";
import { useGenerateClientEstimate } from "@/client-portal/estimate/hooks/use-generate-client-estimate";
import { Button, ConfirmDialog, EmptyState, Spinner } from "@/components/ui";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/**
 * Auto-generates on first visit only (guarded by `!estimate`), same reasoning as the
 * Summary and Features steps — always-regenerating on remount would silently discard
 * "included" toggles and any other client interaction with the estimate.
 */
export function ClientEstimatePage() {
  const navigate = useNavigate();

  const features = useClientConsultationStore((state) => state.features);
  const estimate = useClientConsultationStore((state) => state.estimate);
  const timeline = useClientConsultationStore((state) => state.timeline);
  const complexity = useClientConsultationStore((state) => state.complexity);
  const recommendedTeam = useClientConsultationStore((state) => state.recommendedTeam);
  const featureBreakdown = useClientConsultationStore((state) => state.featureBreakdown);
  const toggleFeatureIncluded = useClientConsultationStore((state) => state.toggleFeatureIncluded);

  const generateEstimate = useGenerateClientEstimate();
  const hasGeneratedRef = useRef(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);

  const requestGeneration = () => {
    if (features.length === 0) return;
    generateEstimate.mutate({
      features: features.map(({ name, category, description, priority, complexity: featureComplexity }) => ({
        name,
        category,
        description,
        priority,
        complexity: featureComplexity,
      })),
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
          action={<Button onClick={() => navigate("/features")}>Go to features</Button>}
        />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Project Estimate</h1>
        <p className="mt-1.5 text-sm text-muted">
          Generated from your feature list. Toggle features off to see how scope affects your project.
        </p>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16">
              <Spinner label="Generating your project estimate" />
            </div>
          ) : null}

          {!isLoading && generateEstimate.isError && !estimate ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted">Something went wrong generating the estimate.</p>
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Project Cost" value="Not available" unavailable />
                <MetricCard label="Timeline" value={timeline ?? "—"} />
                <MetricCard label="Complexity" value={complexity ?? "—"} />
                <MetricCard
                  label="Recommended Team"
                  value={recommendedTeam ? `${recommendedTeam} member${recommendedTeam === 1 ? "" : "s"}` : "—"}
                />
                <MetricCard label="Technology Stack" value="Not available" unavailable />
              </div>

              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">
                  Feature Breakdown
                </h2>
                <div className="mt-3 flex flex-col gap-2">
                  {featureBreakdown.map((item) => (
                    <FeatureBreakdownRow
                      key={item.featureId}
                      item={item}
                      onToggleIncluded={() => toggleFeatureIncluded(item.featureId)}
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
                  <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">Risks</h2>
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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="secondary" onClick={() => navigate("/features")}>
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegenerateConfirmOpen(true)}
              disabled={!estimate || generateEstimate.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button type="button" onClick={() => navigate("/request-proposal")} disabled={!estimate}>
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
