import { AlertTriangle, ArrowRight, ImageOff, Images, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { resolveWizardPlatformLabels } from "@/client-portal/estimate/estimate-pricing";
import { MockupGallery } from "@/client-portal/mockups/components/mockup-gallery";
import { MockupGenerating } from "@/client-portal/mockups/components/mockup-generating";
import { MockupInfoNotice } from "@/client-portal/mockups/components/mockup-info-notice";
import { useConceptMockups } from "@/client-portal/mockups/hooks/use-concept-mockups";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/**
 * Concept mockups — an OPTIONAL step between the Estimate and the Proposal request.
 *
 * Nothing generates on load: a batch (the only feature that spends money per page
 * view) starts only when the client clicks "Generate AI Mockups". They can skip
 * straight to the proposal at any time. A reassurance notice stays visible in every
 * phase so an AI concept is never mistaken for the final, designer-made UI. Nothing
 * here feeds back into the estimate, pricing, or the proposal.
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
    // No estimate → no fetch and no spend. Generation itself is user-initiated.
    enabled: hasPrerequisites,
  });

  const goToProposal = () => navigate("/request-proposal");
  const goToEstimate = () => navigate("/estimate");

  if (!hasPrerequisites) {
    return (
      <ClientLayout>
        <EmptyState
          icon={Images}
          title="No concept screens yet"
          description="A completed project estimate is needed before concept screens can be generated."
          action={<Button onClick={goToEstimate}>Go to estimate</Button>}
        />
      </ClientLayout>
    );
  }

  const set = mockups.set;
  const hasImages = (set?.images.length ?? 0) > 0;
  /**
   * Two different reasons to render the same calm "not available, carry on" panel:
   * DISABLED means the operator has image generation switched off; NOT_APPLICABLE
   * means this engagement type doesn't warrant concept screens (a maintenance
   * contract, or a migration that keeps its interface). Both must never block the
   * proposal, and neither is an error — so they share one branch, differing only
   * in the explanation the server supplies.
   */
  const isNotApplicable = set?.status === "NOT_APPLICABLE";
  const isDisabled = set?.status === "DISABLED" || isNotApplicable;
  const isInitialLoading = !set && mockups.isLoading;

  return (
    <ClientLayout>
      <div>
        {/* Header — friendly framing, present in every phase (section 3). */}
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Sparkles className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.85} />
            AI Visual Preview
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted text-pretty">
            Want to see how your application could look? Generate AI-powered concept
            screens based on your project requirements.
          </p>
        </div>

        {isDisabled ? (
          <>
            <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunken text-muted">
                <ImageOff className="h-5 w-5" strokeWidth={1.85} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isNotApplicable
                    ? "Concept screens aren't part of this engagement"
                    : "Visual previews aren't available right now"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted text-pretty">
                  {isNotApplicable && set?.notApplicableReason
                    ? `${set.notApplicableReason} Your estimate and proposal aren't affected.`
                    : "No problem — your estimate and proposal aren't affected. You can continue to request your proposal."}
                </p>
              </div>
            </div>

            <Footer
              onBack={goToEstimate}
              right={
                <Button onClick={goToProposal}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
          </>
        ) : (
          <>
            {/* Always visible — before AND after generation (sections 4 & 5). */}
            <div className="mt-6">
              <MockupInfoNotice />
            </div>

            <div className="mt-6">
              {isInitialLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-border py-16">
                  <Spinner />
                </div>
              ) : hasImages ? (
                <MockupGallery set={set!} />
              ) : mockups.isGenerating ? (
                <MockupGenerating />
              ) : mockups.isFailed ? (
                <div
                  role="alert"
                  className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-danger/30 bg-danger-subtle/40 px-6 py-12 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-subtle text-danger">
                    <AlertTriangle className="h-5 w-5" strokeWidth={1.85} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      We couldn't create your concept screens
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-muted text-pretty">
                      Your estimate is unaffected — this is just an optional visual
                      preview.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={mockups.retry}>
                    <RotateCcw className="h-4 w-4" />
                    Try again
                  </Button>
                </div>
              ) : (
                // Intro / empty state (NONE): the call to action lives here (section 7).
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
                  <div className="relative mb-6">
                    <div
                      aria-hidden
                      className="asc-gradient-subtle absolute inset-0 -z-10 scale-150 rounded-full opacity-70 blur-xl"
                    />
                    <div className="asc-gradient-accent flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-sm">
                      <Sparkles className="h-7 w-7" strokeWidth={1.6} />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground text-balance">
                    See your idea come to life
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted text-pretty">
                    Generate concept screens to see how your future application could
                    look. This is optional and won't affect your estimate or proposal.
                  </p>
                  <div className="mt-7 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                    <Button
                      size="lg"
                      onClick={mockups.generate}
                      className="w-full sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate AI Mockups
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={goToProposal}
                      className="w-full sm:w-auto"
                    >
                      Skip for now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {hasImages ? (
              <Footer
                onBack={goToEstimate}
                right={
                  <>
                    <Button
                      variant="outline"
                      onClick={mockups.regenerate}
                      disabled={!mockups.canRegenerate || mockups.isRegenerating}
                      isLoading={mockups.isRegenerating}
                      title={
                        mockups.canRegenerate
                          ? undefined
                          : "You've reached the limit for regenerating concept screens."
                      }
                    >
                      <RotateCcw className="h-4 w-4" />
                      Generate New Concepts
                    </Button>
                    <Button onClick={goToProposal}>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                }
              />
            ) : (
              // Intro / generating / failed: a skip is always one click away, so an
              // optional preview can never trap a client short of their proposal.
              <Footer
                onBack={goToEstimate}
                right={
                  <Button variant="ghost" onClick={goToProposal}>
                    Skip for now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                }
              />
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}

function Footer({
  onBack,
  right,
}: {
  onBack: () => void;
  right: ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
      <Button type="button" variant="secondary" onClick={onBack}>
        Back
      </Button>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}
