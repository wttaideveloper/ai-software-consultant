import { Images, RotateCcw, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { resolveWizardPlatformLabels } from "@/client-portal/estimate/estimate-pricing";
import { MockupGallery } from "@/client-portal/mockups/components/mockup-gallery";
import { useConceptMockups } from "@/client-portal/mockups/hooks/use-concept-mockups";
import { Button, EmptyState } from "@/components/ui";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/**
 * Concept mockups — its own step between the Estimate and the Proposal request.
 *
 * Being a route of its own is what keeps image generation (30-90s, and the only
 * feature that spends money per page view) entirely off the estimate: the client
 * reads a finished estimate with no pending work behind it, and a batch only
 * starts once they choose to continue here. Nothing on this page feeds back into
 * the estimate or its pricing.
 */
export function ClientMockupsPage() {
  const navigate = useNavigate();

  const summary = useClientConsultationStore((state) => state.summary);
  const features = useClientConsultationStore((state) => state.features);
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore((state) => state.otherPlatform);
  const estimate = useClientConsultationStore((state) => state.estimate);
  const techStack = useClientConsultationStore((state) => state.techStack);

  const platformLabels = useMemo(
    () => resolveWizardPlatformLabels(platforms, otherPlatform),
    [platforms, otherPlatform],
  );

  const promptFeatures = useMemo(
    () =>
      features.map(({ name, category, description, priority, complexity }) => ({
        name,
        category,
        description,
        priority,
        complexity,
      })),
    [features],
  );

  const hasPrerequisites = Boolean(estimate) && Boolean(summary) && features.length > 0;

  const mockups = useConceptMockups({
    requirementSummary: summary,
    features: promptFeatures,
    platforms: platformLabels,
    techStack: techStack ?? [],
    // Same gate as before, now also the guard for this page: no estimate, no spend.
    enabled: hasPrerequisites,
  });

  if (!hasPrerequisites) {
    return (
      <ClientLayout>
        <EmptyState
          icon={Images}
          title="No concept screens yet"
          description="A completed project estimate is needed before concept screens can be generated."
          action={<Button onClick={() => navigate("/estimate")}>Go to estimate</Button>}
        />
      </ClientLayout>
    );
  }

  const hasImages = (mockups.set?.images.length ?? 0) > 0;

  return (
    <ClientLayout>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <Sparkles className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.85} />
              This is how I envision your project
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted text-pretty">
              These concept screens were generated from your requirements and are
              intended only as an early visual preview.
            </p>
          </div>

          {hasImages ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={mockups.regenerate}
              disabled={!mockups.canRegenerate || mockups.isRegenerating || mockups.isGenerating}
              isLoading={mockups.isRegenerating}
              title={
                mockups.canRegenerate
                  ? undefined
                  : "You've reached the regeneration limit for this consultation."
              }
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate Mockups
            </Button>
          ) : null}
        </div>

        <div className="mt-6">
          <MockupGallery
            set={mockups.set}
            isGenerating={mockups.isGenerating}
            isFailed={mockups.isFailed}
            onRetry={mockups.retry}
          />
        </div>

        {/*
          Continue is never gated on the concepts: they're a preview, so a slow,
          failed or switched-off batch must not trap the client short of the
          proposal request they came for.
        */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="secondary" onClick={() => navigate("/estimate")}>
            Back
          </Button>
          <Button type="button" onClick={() => navigate("/request-proposal")}>
            Continue
          </Button>
        </div>
      </div>
    </ClientLayout>
  );
}
