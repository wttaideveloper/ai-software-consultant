import { FileText, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { useGenerateClientSummary } from "@/client-portal/summary/hooks/use-generate-client-summary";
import { Button, ConfirmDialog, EmptyState, Spinner, Textarea } from "@/components/ui";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/**
 * Auto-generates on first visit only (guarded by `!summary`) — regenerating on every
 * remount would silently overwrite any edit the visitor made, which contradicts the
 * edited summary being the source of truth. "Regenerate" is the explicit, confirmed
 * way to intentionally discard the current text and get a fresh AI pass.
 */
export function ClientRequirementSummaryPage() {
  const navigate = useNavigate();

  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore((state) => state.otherPlatform);
  const conversation = useClientConsultationStore((state) => state.conversation);
  const summary = useClientConsultationStore((state) => state.summary);
  const setSummary = useClientConsultationStore((state) => state.setSummary);
  const resetDiscovery = useClientConsultationStore((state) => state.resetDiscovery);

  const generateSummary = useGenerateClientSummary();
  const hasGeneratedRef = useRef(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);

  const requestGeneration = () => {
    generateSummary.mutate({
      projectIdea,
      platforms,
      otherPlatform: otherPlatform || undefined,
      conversation,
    });
  };

  useEffect(() => {
    if (hasGeneratedRef.current || summary || conversation.length === 0) {
      return;
    }
    hasGeneratedRef.current = true;
    requestGeneration();
    // Intentionally runs once on first visit only — see the guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => {
    resetDiscovery();
    navigate("/requirements/questions");
  };

  const handleRegenerate = () => {
    setIsRegenerateConfirmOpen(false);
    requestGeneration();
  };

  const handleContinue = () => {
    navigate("/features");
  };

  const isLoading = generateSummary.isPending && !summary;

  if (conversation.length === 0 && !summary) {
    return (
      <ClientLayout>
        <EmptyState
          icon={FileText}
          title="No discovery answers yet"
          description="Complete the AI discovery interview first so a requirement summary can be generated from it."
          action={
            <Button onClick={() => navigate("/requirements/project-idea")}>Start discovery</Button>
          }
        />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Requirement Summary
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Generated from your discovery answers. Feel free to edit it before continuing.
        </p>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16">
              <Spinner label="Generating your requirement summary" />
            </div>
          ) : null}

          {!isLoading && generateSummary.isError && !summary ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted">Something went wrong generating the summary.</p>
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-hover"
                onClick={requestGeneration}
              >
                Try again
              </button>
            </div>
          ) : null}

          {summary ? (
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={18}
              className="font-mono text-[13px] leading-relaxed"
            />
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="secondary" onClick={handleBack}>
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRegenerateConfirmOpen(true)}
              disabled={!summary || generateSummary.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </Button>
            <Button type="button" onClick={handleContinue} disabled={!summary}>
              Continue
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isRegenerateConfirmOpen}
        onClose={() => setIsRegenerateConfirmOpen(false)}
        onConfirm={handleRegenerate}
        title="Regenerate summary?"
        description="This replaces the current summary with a fresh one from the AI, discarding any edits you've made."
        confirmLabel="Regenerate"
        tone="primary"
        isLoading={generateSummary.isPending}
      />
    </ClientLayout>
  );
}
