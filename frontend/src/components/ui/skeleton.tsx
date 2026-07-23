import { cn } from "@/utils/cn";

type SkeletonProps = {
  className?: string;
};

/**
 * Shimmer (not opacity pulse) — a travelling sheen reads as "content loading"
 * rather than "element disabled". The sweep animates `transform` only, so it
 * stays on the compositor and costs nothing on the main thread.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("asc-skeleton rounded-lg", className)}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/** Text placeholder with a short final line, mimicking a real paragraph. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
