import { AlertTriangle, ImageOff, RotateCcw } from "lucide-react";
import { MockupCard } from "@/client-portal/mockups/components/mockup-card";
import { Button, Spinner } from "@/components/ui";
import type { ClientMockupSet } from "@/services/client-mockups.service";

type MockupGalleryProps = {
  set: ClientMockupSet | undefined;
  isGenerating: boolean;
  isFailed: boolean;
  onRetry: () => void;
};

const DISCLAIMER =
  "These images are AI-generated concepts and are intended for visualization only. Final UI/UX design may differ.";

// A calm 1-col (mobile) / 2-col (tablet+) presentation grid. The vertical gap is
// deliberately large so each screen reads as its own section — title, image,
// caption — rather than as a tile in a dense gallery.
const GALLERY_LAYOUT = "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16";

/**
 * Body of the "This is how I envision your project" step — the heading and the
 * Regenerate control belong to the page, which owns the step chrome around it.
 *
 * Unlike when this lived under the estimate, it can no longer render nothing:
 * it is the whole point of its own route, so every status resolves to a visible
 * state. `DISABLED` says so plainly rather than leaving a blank screen behind a
 * heading that promised concept screens.
 */
export function MockupGallery({ set, isGenerating, isFailed, onRetry }: MockupGalleryProps) {
  const hasImages = (set?.images.length ?? 0) > 0;

  // ── Switched off for this deployment ───────────────────────────────────
  if (set?.status === "DISABLED") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunken text-muted">
          <ImageOff className="h-5 w-5" strokeWidth={1.85} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Visual concepts aren't available right now
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted text-pretty">
            Your estimate is unaffected — continue to request your proposal.
          </p>
        </div>
      </div>
    );
  }

  // ── Failed ─────────────────────────────────────────────────────────────
  if (isFailed && !isGenerating && !hasImages) {
    return (
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
    );
  }

  // ── Generating (or still resolving what state we're in) ────────────────
  if (!hasImages) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-muted/40 py-16">
        <Spinner />
        <p className="text-sm font-medium text-foreground-soft">
          {isGenerating ? "Generating visual concepts..." : "Preparing your concept screens..."}
        </p>
        <p className="max-w-xs text-center text-xs text-muted text-pretty">
          This can take up to a minute — your estimate is already final.
        </p>
      </div>
    );
  }

  return (
    <>
      {/*
        Each screen is presented independently — title, hero image, caption — in a
        single column on mobile and two on tablet/desktop. Images stay lazy, so the
        vertical stack doesn't front-load several megabytes on a phone.
      */}
      <ul className={GALLERY_LAYOUT}>
        {set?.images.map((image, index) => (
          <li key={image.id}>
            <MockupCard image={image} index={index} />
          </li>
        ))}
      </ul>

      {set?.stale ? (
        <p className="mt-3 text-xs text-muted">
          Your requirements changed since these were created. Regenerate to refresh
          them.
        </p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-muted text-pretty">{DISCLAIMER}</p>
    </>
  );
}
