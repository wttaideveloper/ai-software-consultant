import { Skeleton } from "@/components/ui/skeleton";

export function ConsultationListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-transparent px-3 py-3">
          <Skeleton className="h-4 w-3/4" />
          <div className="mt-2 flex items-center justify-between">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
