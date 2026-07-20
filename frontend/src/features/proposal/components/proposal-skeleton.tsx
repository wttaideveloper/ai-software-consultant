import { Skeleton } from "@/components/ui/skeleton";

export function ProposalSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-6 w-2/3" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}
