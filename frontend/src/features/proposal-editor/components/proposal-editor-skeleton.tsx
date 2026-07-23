import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-2 h-3 w-60" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-full" />
        ))}
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ProposalEditorSkeleton() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div>
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="mt-2 h-5 w-52" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      <div className="flex flex-col gap-5">
        <SectionSkeleton rows={5} />
        <SectionSkeleton rows={6} />
        <SectionSkeleton rows={4} />
        <SectionSkeleton rows={4} />
      </div>
    </div>
  );
}
