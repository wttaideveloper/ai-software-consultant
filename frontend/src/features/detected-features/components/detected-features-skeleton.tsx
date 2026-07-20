import { Skeleton } from "@/components/ui/skeleton";

export function DetectedFeaturesSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div key={groupIndex} className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="mt-3 h-4 w-32" />
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, itemIndex) => (
              <div key={itemIndex} className="rounded-lg border border-border/60 p-4">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-1.5 h-3 w-3/4" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
