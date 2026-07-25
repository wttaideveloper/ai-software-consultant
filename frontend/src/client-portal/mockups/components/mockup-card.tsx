import { useState } from "react";
import { MockupLightbox } from "@/client-portal/mockups/components/mockup-lightbox";
import {
  resolveMockupImageUrl,
  type ClientMockupImage,
} from "@/services/client-mockups.service";
import { cn } from "@/utils/cn";

type MockupCardProps = {
  image: ClientMockupImage;
  /** 0-based position, rendered as a "01" / "02" index above the title. */
  index: number;
};

/**
 * One concept screen, presented like a design handoff: a numbered title, the
 * generated image as the hero, then a short supporting caption — no enclosing
 * card. The image is loaded lazily and fades in over its own skeleton (a batch is
 * several MB), and clicking it opens the fullscreen lightbox.
 */
export function MockupCard({ image, index }: MockupCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const src = resolveMockupImageUrl(image.imageUrl);
  const canOpen = isLoaded && !hasFailed;

  return (
    <figure className="flex flex-col">
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <figcaption className="mb-3 flex items-baseline gap-2.5">
        <span className="asc-tabular text-sm font-semibold text-accent-text">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-foreground text-balance">
          {image.screenName}
        </h3>
      </figcaption>

      {/* ── Image (hero) ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => canOpen && setIsLightboxOpen(true)}
        disabled={!canOpen}
        aria-label={`View the ${image.screenName} concept screen full size`}
        className={cn(
          "group relative block aspect-4/3 w-full overflow-hidden rounded-2xl",
          "border border-border bg-surface-muted shadow-sm",
          "transition-shadow duration-300",
          canOpen && "cursor-pointer hover:shadow-xl",
        )}
      >
        {!isLoaded && !hasFailed ? (
          <div className="asc-skeleton absolute inset-0" aria-hidden />
        ) : null}

        {hasFailed ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
            This concept image couldn't be loaded.
          </div>
        ) : (
          <img
            src={src}
            alt={`Concept mockup of the ${image.screenName} screen`}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasFailed(true)}
            className={cn(
              // object-contain never crops; the muted panel fills any letterboxing.
              "h-full w-full object-contain transition-[opacity,transform] duration-300",
              "group-hover:scale-[1.03]",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </button>

      {/* ── Description ───────────────────────────────────────────────── */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted text-pretty">
        {image.description}
      </p>

      {canOpen ? (
        <MockupLightbox
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          src={src}
          screenName={image.screenName}
          description={image.description}
        />
      ) : null}
    </figure>
  );
}
