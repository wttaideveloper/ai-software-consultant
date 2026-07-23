import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Code2,
  FileText,
  LayoutList,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { SummarySectionCard } from "@/client-portal/summary/components/summary-section-card";
import { SummarySkeleton } from "@/client-portal/summary/components/summary-skeleton";
import { useGenerateClientSummary } from "@/client-portal/summary/hooks/use-generate-client-summary";
import {
  normalizeSectionBody,
  parseSummarySections,
  spliceRange,
} from "@/client-portal/summary/parse-summary-sections";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import { cn } from "@/utils/cn";
import { staggerContainer, staggerItem } from "@/utils/motion";

type EditMode = "guided" | "markdown";

/**
 * Auto-generates on first visit only (guarded by `!summary`) — regenerating on every
 * remount would silently overwrite any edit the visitor made, which contradicts the
 * edited summary being the source of truth. "Regenerate" is the explicit, confirmed
 * way to intentionally discard the current text and get a fresh AI pass.
 *
 * Presentation is section-first: the summary is parsed into its `##` sections and
 * rendered as a document the visitor can edit one part at a time. The stored value
 * remains a single markdown string — edits splice into it by offset, so the shape
 * submitted with the lead is unchanged (see parse-summary-sections.ts).
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
  const [mode, setMode] = useState<EditMode>("guided");

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

  const parsed = useMemo(
    () => (summary ? parseSummarySections(summary) : null),
    [summary],
  );

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

  /** Splices one section's body back into the single stored markdown string. */
  const handleSectionSave = (bodyStart: number, bodyEnd: number, body: string) => {
    if (!summary) return;
    setSummary(
      spliceRange(summary, bodyStart, bodyEnd, normalizeSectionBody(body)),
    );
  };

  const isLoading = generateSummary.isPending && !summary;
  const isRegenerating = generateSummary.isPending && Boolean(summary);

  // ── No discovery answers yet ────────────────────────────────────────────
  if (conversation.length === 0 && !summary) {
    return (
      <ClientLayout>
        <EmptyState
          icon={FileText}
          title="No discovery answers yet"
          description="Complete the AI discovery interview first so a requirement summary can be generated from it."
          action={
            <Button onClick={() => navigate("/requirements/project-idea")}>
              Start discovery
            </Button>
          }
        />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div>
        <header className="mb-6">
          <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold tracking-tight text-foreground text-balance">
            Requirement Summary
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted text-pretty sm:text-base">
            We've turned your answers into a structured brief. Review each section and
            edit anything that doesn't look right — this is what your proposal will be
            based on.
          </p>
        </header>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {isLoading ? <SummarySkeleton /> : null}

        {/* ── Error (nothing to fall back to) ─────────────────────────── */}
        {!isLoading && generateSummary.isError && !summary ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-danger/30 bg-danger-subtle/40 px-6 py-12 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-subtle text-danger">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.85} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                We couldn't write your summary
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted text-pretty">
                Something went wrong on our side. Your answers are saved — try again.
              </p>
            </div>
            <Button variant="secondary" onClick={requestGeneration}>
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : null}

        {/* ── Summary ─────────────────────────────────────────────────── */}
        {summary && parsed ? (
          <div className={cn(isRegenerating && "pointer-events-none opacity-50")}>
            {/* Toolbar: view mode + regenerate */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Editing mode"
                className="flex gap-1 rounded-xl border border-border bg-surface-muted p-1"
              >
                {(
                  [
                    { id: "guided", label: "Sections", icon: LayoutList },
                    { id: "markdown", label: "Markdown", icon: Code2 },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={mode === id}
                    onClick={() => setMode(id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                      "transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      mode === id
                        ? "bg-surface text-accent-text shadow-xs"
                        : "text-muted hover:text-foreground-soft",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsRegenerateConfirmOpen(true)}
                disabled={generateSummary.isPending}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>

            {mode === "guided" ? (
              <>
                {/* Intro (the `#` title and lead paragraph) renders as-is —
                    it's context, not something a client needs to edit. */}
                {parsed.intro.trim().length > 0 ? (
                  <div className="mb-4 rounded-2xl border border-border bg-surface px-5 py-4">
                    <MarkdownViewer content={parsed.intro} className="text-sm" />
                  </div>
                ) : null}

                {parsed.sections.length === 0 ? (
                  // No `##` headings — fall back to editing the whole document.
                  <div className="rounded-2xl border border-border bg-surface px-5 py-4">
                    <MarkdownViewer content={summary} className="text-sm" />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setMode("markdown")}
                    >
                      Edit summary
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-4"
                  >
                    {parsed.sections.map((section, index) => (
                      <motion.div key={section.id} variants={staggerItem}>
                        <SummarySectionCard
                          index={index}
                          section={section}
                          onSave={(body) =>
                            handleSectionSave(
                              section.bodyStart,
                              section.bodyEnd,
                              body,
                            )
                          }
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <label
                  htmlFor="summary-markdown"
                  className="text-sm font-medium text-foreground-soft"
                >
                  Full summary (Markdown)
                </label>
                <textarea
                  id="summary-markdown"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={24}
                  className={cn(
                    "mt-2 w-full resize-y rounded-lg border border-border bg-canvas px-3.5 py-3",
                    "font-mono text-[13px] leading-relaxed text-foreground",
                    "transition-[border-color,box-shadow] duration-200",
                    "focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20",
                  )}
                />
                <p className="mt-2 text-xs text-muted">
                  Editing the raw document. Switch to <strong>Sections</strong> for a
                  guided view.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="secondary" onClick={handleBack}>
            Back
          </Button>

          <Button
            type="button"
            onClick={handleContinue}
            disabled={!summary || generateSummary.isPending}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
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
