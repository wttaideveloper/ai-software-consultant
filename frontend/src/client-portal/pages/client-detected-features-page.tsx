import { ListChecks, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { FeatureCard } from "@/client-portal/features/components/feature-card";
import {
  FeatureFormModal,
  type FeatureFormValues,
} from "@/client-portal/features/components/feature-form-modal";
import { groupFeaturesByCategory } from "@/client-portal/features/group-features-by-category";
import { useGenerateClientFeatures } from "@/client-portal/features/hooks/use-generate-client-features";
import { Badge, Button, ConfirmDialog, EmptyState, Spinner } from "@/components/ui";
import { useClientConsultationStore, type ClientFeature } from "@/store/client-consultation.store";

/**
 * Auto-generates on first visit only (guarded by `features.length === 0`), same
 * reasoning as the Summary step: always-regenerating on remount would silently
 * overwrite the client's edits, contradicting "the edited feature list becomes the
 * source of truth." Regenerate is the explicit, confirmed way to discard edits.
 */
export function ClientDetectedFeaturesPage() {
  const navigate = useNavigate();

  const summary = useClientConsultationStore((state) => state.summary);
  const consultationMode = useClientConsultationStore(
    (state) => state.consultationMode,
  );
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore((state) => state.otherPlatform);
  const features = useClientConsultationStore((state) => state.features);
  const addFeature = useClientConsultationStore((state) => state.addFeature);
  const updateFeature = useClientConsultationStore((state) => state.updateFeature);
  const removeFeature = useClientConsultationStore((state) => state.removeFeature);

  const generateFeatures = useGenerateClientFeatures();
  const hasGeneratedRef = useRef(false);

  const [formModalState, setFormModalState] = useState<"closed" | "add" | ClientFeature>("closed");
  const [featureToRemove, setFeatureToRemove] = useState<ClientFeature | null>(null);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);

  const requestGeneration = () => {
    if (!summary) return;
    generateFeatures.mutate({ consultationMode, summary });
  };

  useEffect(() => {
    if (hasGeneratedRef.current || features.length > 0 || !summary) {
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

  const handleFormSubmit = (values: FeatureFormValues) => {
    if (formModalState !== "closed" && formModalState !== "add") {
      updateFeature(formModalState.id, values);
    } else {
      addFeature(values);
    }
    setFormModalState("closed");
  };

  const isLoading = generateFeatures.isPending && features.length === 0;
  const platformsSummary = otherPlatform.trim() ? [...platforms, otherPlatform.trim()] : platforms;
  const groups = groupFeaturesByCategory(features);

  if (!summary) {
    return (
      <ClientLayout>
        <EmptyState
          icon={ListChecks}
          title="No requirement summary yet"
          description="A requirement summary is needed before features can be detected."
          action={<Button onClick={() => navigate("/summary")}>Go to summary</Button>}
        />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Detected Features</h1>
        <p className="mt-1.5 text-sm text-muted">
          Generated from your requirement summary. Add, edit, or remove anything before continuing.
        </p>
        {platformsSummary.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">Target platforms:</span>
            {platformsSummary.map((platform) => (
              <Badge key={platform}>{platform}</Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16">
              <Spinner label="Detecting features" />
            </div>
          ) : null}

          {!isLoading && generateFeatures.isError && features.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted">Something went wrong detecting features.</p>
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-hover"
                onClick={requestGeneration}
              >
                Try again
              </button>
            </div>
          ) : null}

          {!isLoading && !generateFeatures.isError && features.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No features yet"
              description="Add a custom feature, or regenerate from your requirement summary."
              action={<Button onClick={() => setFormModalState("add")}>Add custom feature</Button>}
            />
          ) : null}

          {groups.length > 0 ? (
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <div key={group.category}>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">
                    {group.category}
                  </h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {group.features.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        onEdit={() => setFormModalState(feature)}
                        onRemove={() => setFeatureToRemove(feature)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                className="self-start"
                onClick={() => setFormModalState("add")}
              >
                <Plus className="h-4 w-4" />
                Add custom feature
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="secondary" onClick={() => navigate("/summary")}>
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegenerateConfirmOpen(true)}
              disabled={features.length === 0 || generateFeatures.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/estimate")}
              disabled={features.length === 0}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      <FeatureFormModal
        open={formModalState !== "closed"}
        onClose={() => setFormModalState("closed")}
        onSubmit={handleFormSubmit}
        initialValues={
          formModalState !== "closed" && formModalState !== "add" ? formModalState : undefined
        }
      />

      <ConfirmDialog
        open={featureToRemove !== null}
        onClose={() => setFeatureToRemove(null)}
        onConfirm={() => {
          if (featureToRemove) removeFeature(featureToRemove.id);
          setFeatureToRemove(null);
        }}
        title="Remove feature?"
        description={
          featureToRemove
            ? `"${featureToRemove.name}" will be removed from the feature list.`
            : "This feature will be removed from the feature list."
        }
        confirmLabel="Remove"
        tone="danger"
      />

      <ConfirmDialog
        open={isRegenerateConfirmOpen}
        onClose={() => setIsRegenerateConfirmOpen(false)}
        onConfirm={handleRegenerate}
        title="Regenerate features?"
        description="This replaces the current feature list with a fresh one from the AI, discarding any edits you've made."
        confirmLabel="Regenerate"
        tone="primary"
        isLoading={generateFeatures.isPending}
      />
    </ClientLayout>
  );
}
