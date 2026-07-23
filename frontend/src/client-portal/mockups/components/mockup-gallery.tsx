import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { MockupCard } from "@/client-portal/mockups/components/mockup-card";
import { Button, Spinner } from "@/components/ui";
import type { ClientMockupSet } from "@/services/client-mockups.service";

type MockupGalleryProps = {
  set: ClientMockupSet | undefined;
  isGenerating: boolean;
  isRegenerating: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onRetry: () => void;
};

const DISCLAIMER =
  "These images are AI-generated concepts and are intended for visualization only. Final UI/UX design may differ.";

const GALLERY_LAYOUT = [
  "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]",
  "sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0",
].join(" ");

/**
 * "This is how I envision your project" — the concept preview below the estimate.
 *
 * Renders nothing at all when the feature is switched off or nothing has been
 * requested yet, so an operator who has not enabled image generation gets a page
 * identical to before rather than an empty promise.
 */
export function MockupGallery({
  set,
  isGenerating,
  isRegenerating,
  canRegenerate,
  onRegenerate,
  onRetry,
}: MockupGalleryProps) {
  if (!set || set.status === "DISABLED" || set.status === "NONE") {
    return null;
  }

  const hasImages = set.images.length > 0;

  return (
    <section aria-labelledby="concept-mockups-heading" className="mt-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="concept-mockups-heading"
            className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.85} />
            This is how I envision your project
          </h2>
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
            onClick={onRegenerate}
            disabled={!canRegenerate || isRegenerating || isGenerating}
            isLoading={isRegenerating}
            title={
              canRegenerate
                ? undefined
                : "You've reached the regeneration limit for this consultation."
            }
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerate Mockups
          </Button>
        ) : null}
      </header>

      <div className="mt-5">
        {/* ── Generating ──────────────────────────────────────────────── */}
        {isGenerating && !hasImages ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted/40 py-16">
            <Spinner />
            <p className="text-sm font-medium text-foreground-soft">
              Generating visual concepts...
            </p>
            <p className="max-w-xs text-center text-xs text-muted text-pretty">
              This takes a little longer than the estimate — your estimate above is
              already final.
            </p>
          </div>
        ) : null}

        {/* ── Failed ──────────────────────────────────────────────────── */}
        {set.status === "FAILED" && !isGenerating && !hasImages ? (
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
                Your estimate is unaffected — this is just the visual preview.
              </p>
            </div>
            <Button variant="secondary" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : null}

        {/* ── Gallery ─────────────────────────────────────────────────── */}
        {hasImages ? (
          <>
            {/*
              Mobile: a horizontal snap carousel, so five multi-megabyte concepts
              don't turn the page into an endless scroll on a phone. Desktop (sm+):
              a two-column grid. Native scroll rather than a JS carousel — it keeps
              keyboard, trackpad and touch behaviour correct for free.
            */}
            <ul className={GALLERY_LAYOUT}>
              {set.images.map((image) => (
                <li
                  key={image.id}
                  className="w-[78vw] max-w-sm shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink"
                >
                  <MockupCard image={image} />
                </li>
              ))}
            </ul>

            {set.stale ? (
              <p className="mt-3 text-xs text-muted">
                Your requirements changed since these were created. Regenerate to
                refresh them.
              </p>
            ) : null}

            <p className="mt-4 text-xs leading-relaxed text-muted text-pretty">
              {DISCLAIMER}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
