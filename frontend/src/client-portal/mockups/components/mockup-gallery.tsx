import { MockupCard } from "@/client-portal/mockups/components/mockup-card";
import type { ClientMockupSet } from "@/services/client-mockups.service";

type MockupGalleryProps = {
  set: ClientMockupSet;
};

const DISCLAIMER =
  "These images are AI-generated concepts and are intended for visualization only. Final UI/UX design may differ.";

// A calm 1-col (mobile) / 2-col (tablet+) presentation grid. The vertical gap is
// deliberately large so each screen reads as its own section — title, image,
// caption — rather than as a tile in a dense gallery.
const GALLERY_LAYOUT = "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16";

/**
 * Renders the generated concept screens. Presentation only — the page decides
 * *when* to show this (i.e. once images exist); every other phase (intro,
 * generating, failed, disabled) is owned by the page.
 */
export function MockupGallery({ set }: MockupGalleryProps) {
  return (
    <div>
      {/*
        Each screen is presented independently — title, hero image, caption — in a
        single column on mobile and two on tablet/desktop. Images stay lazy, so the
        vertical stack doesn't front-load several megabytes on a phone.
      */}
      <ul className={GALLERY_LAYOUT}>
        {set.images.map((image, index) => (
          <li key={image.id}>
            <MockupCard image={image} index={index} />
          </li>
        ))}
      </ul>

      {set.stale ? (
        <p className="mt-6 text-xs text-muted">
          Your requirements changed since these were created. Generate new concepts to
          refresh them.
        </p>
      ) : null}

      <p className="mt-6 text-xs leading-relaxed text-muted text-pretty">{DISCLAIMER}</p>
    </div>
  );
}
