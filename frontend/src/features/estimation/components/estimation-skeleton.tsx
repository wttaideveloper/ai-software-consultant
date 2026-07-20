import { Skeleton } from "@/components/ui/skeleton";

export function EstimationSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="mt-3 h-4 w-40" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="mt-4 h-3 w-24" />
            <Skeleton className="mt-2 h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    </div>
  );
}
