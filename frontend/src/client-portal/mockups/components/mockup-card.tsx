import { useState } from "react";
import {
  resolveMockupImageUrl,
  type ClientMockupImage,
} from "@/services/client-mockups.service";
import { cn } from "@/utils/cn";

type MockupCardProps = {
  image: ClientMockupImage;
};

/**
 * One concept screen. The image is loaded lazily and fades in over its own
 * skeleton — a batch is several MB, so rendering all of them eagerly would stall
 * the Estimate page the visitor actually came for.
 */
export function MockupCard({ image }: MockupCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-shadow duration-200 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {!isLoaded && !hasFailed ? (
          <div className="asc-skeleton absolute inset-0" aria-hidden />
        ) : null}

        {hasFailed ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted">
            This concept image couldn't be loaded.
          </div>
        ) : (
          <img
            src={resolveMockupImageUrl(image.imageUrl)}
            alt={`Concept mockup of the ${image.screenName} screen`}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>

      <figcaption className="border-t border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {image.screenName}
        </h3>
        <p className="mt-1 text-sm text-muted text-pretty">{image.description}</p>
      </figcaption>
    </figure>
  );
}
