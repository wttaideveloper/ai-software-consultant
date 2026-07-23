import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
        </div>
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-full" />
        ))}
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function LeadDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Client information card */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-4 border-b border-border px-5 py-5">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="mt-2 h-3.5 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionSkeleton rows={5} />
      <SectionSkeleton rows={4} />
      <SectionSkeleton rows={3} />
    </div>
  );
}
