import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Code2,
  FileText,
  LayoutList,
  MessageSquarePlus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { SummarySectionCard } from "@/client-portal/summary/components/summary-section-card";
import { SummarySkeleton } from "@/client-portal/summary/components/summary-skeleton";
import { useGenerateClientSummary } from "@/client-portal/summary/hooks/use-generate-client-summary";
import {
  ADDITIONAL_NOTES_HEADING,
  normalizeSectionBody,
  parseSummarySections,
  spliceRange,
  upsertNamedSection,
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
  const consultationMode = useClientConsultationStore(
    (state) => state.consultationMode,
  );
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore(
    (state) => state.otherPlatform,
  );
  const conversation = useClientConsultationStore(
    (state) => state.conversation,
  );
  const summary = useClientConsultationStore((state) => state.summary);
  const setSummary = useClientConsultationStore((state) => state.setSummary);
  const additionalNotes = useClientConsultationStore(
    (state) => state.additionalNotes,
  );
  const setAdditionalNotes = useClientConsultationStore(
    (state) => state.setAdditionalNotes,
  );
  const resetDiscovery = useClientConsultationStore(
    (state) => state.resetDiscovery,
  );

  const generateSummary = useGenerateClientSummary();
  const hasGeneratedRef = useRef(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  const [regenerateRequested, setRegenerateRequested] = useState(false);
  const [mode, setMode] = useState<EditMode>("guided");

  const requestGeneration = ({
    regenerate = false,
  }: { regenerate?: boolean } = {}) => {
    // Track *why* the mutation is running. Only an explicit regenerate should dim
    // the existing summary; the initial generation must not (see isRegenerating).
    setRegenerateRequested(regenerate);
    generateSummary.mutate({
      consultationMode,
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

  // The "Additional Notes" section is owned by the notes box at the bottom, so
  // keep it out of the guided section cards — otherwise the same text would be
  // editable in two places that could drift apart.
  const guidedSections = useMemo(
    () =>
      parsed?.sections.filter(
        (section) =>
          section.heading.trim().toLowerCase() !==
          ADDITIONAL_NOTES_HEADING.toLowerCase(),
      ) ?? [],
    [parsed],
  );

  const handleBack = () => {
    resetDiscovery();
    navigate("/requirements/questions");
  };

  const handleRegenerate = () => {
    setIsRegenerateConfirmOpen(false);
    requestGeneration({ regenerate: true });
  };

  const handleContinue = () => {
    // Fold the client's free-form note into the summary as its "Additional Notes"
    // section so it flows to feature detection and the submitted lead unchanged —
    // the rest of the pipeline only ever reads the single summary string.
    if (summary) {
      const merged = upsertNamedSection(
        summary,
        ADDITIONAL_NOTES_HEADING,
        additionalNotes,
      );
      if (merged !== summary) setSummary(merged);
    }
    navigate("/features");
  };

  /** Splices one section's body back into the single stored markdown string. */
  const handleSectionSave = (
    bodyStart: number,
    bodyEnd: number,
    body: string,
  ) => {
    if (!summary) return;
    setSummary(
      spliceRange(summary, bodyStart, bodyEnd, normalizeSectionBody(body)),
    );
  };

  const isLoading = generateSummary.isPending && !summary;
  // Single "busy over an existing summary" signal — drives the dim overlay and the
  // disabled state of Continue / Regenerate. Deliberately NOT raw
  // `generateSummary.isPending`: the first summary is generated from a mount
  // effect, and under StrictMode (dev) that mutation's observer can keep reporting
  // isPending=true after it has actually resolved and set `summary`, which would
  // strand every isPending-gated control disabled until a page refresh. Keying off
  // an explicit regenerate request — which the initial generation never sets — and
  // still AND-ing with isPending (so it clears the instant a real regenerate,
  // fired from a click and thus unaffected, settles) is immune to that artifact.
  const isRegenerating = regenerateRequested && generateSummary.isPending;

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
            We've turned your answers into a structured brief. Review each
            section and edit anything that doesn't look right — this is what
            your proposal will be based on.
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
                Something went wrong on our side. Your answers are saved — try
                again.
              </p>
            </div>
            <Button variant="secondary" onClick={() => requestGeneration()}>
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : null}

        {/* ── Summary ─────────────────────────────────────────────────── */}
        {summary && parsed ? (
          <div
            className={cn(isRegenerating && "pointer-events-none opacity-50")}
          >
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
                disabled={isRegenerating}
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
                    <MarkdownViewer
                      content={parsed.intro}
                      className="text-sm"
                    />
                  </div>
                ) : null}

                {guidedSections.length === 0 ? (
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
                    {guidedSections.map((section, index) => (
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
                  Editing the raw document. Switch to <strong>Sections</strong>{" "}
                  for a guided view.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* ── Final confirmation + free-form notes ────────────────────── */}
        {summary && parsed ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface-muted/40 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="asc-gradient-subtle flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent-text"
              >
                <MessageSquarePlus className="h-4 w-4" strokeWidth={1.85} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  This is the final requirement summary from our discussion.
                </p>
                <p className="mt-1 text-sm text-muted text-pretty">
                  Would you like to add anything or make any changes? You can
                  edit any section above or add anything else here, and it will
                  be included in the summary.
                </p>
              </div>
            </div>

            <label htmlFor="additional-notes" className="sr-only">
              Anything else to add
            </label>
            <textarea
              id="additional-notes"
              value={additionalNotes}
              onChange={(event) => setAdditionalNotes(event.target.value)}
              rows={3}
              placeholder="Feel free to add anything else…"
              className={cn(
                "mt-4 w-full resize-y rounded-lg border border-border bg-canvas px-3.5 py-3",
                "text-sm leading-relaxed text-foreground placeholder:text-muted",
                "transition-[border-color,box-shadow] duration-200",
                "focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20",
              )}
            />
          </div>
        ) : null}

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button type="button" variant="secondary" onClick={handleBack}>
            Back
          </Button>

          <Button
            type="button"
            onClick={handleContinue}
            disabled={!summary || isRegenerating}
          >
            No, I'm good to go!
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
        isLoading={isRegenerating}
      />
    </ClientLayout>
  );
}
