import { History } from "lucide-react";
import { SectionError } from "@/components/shared/section-error";
import { Timeline } from "@/components/shared/timeline";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDashboardActivity } from "@/features/dashboard/dashboard-activity";
import { useRecentClientRequests } from "@/features/dashboard/hooks/use-recent-client-requests";

function ActivitySkeleton() {
  return (
    <Card hover={false}>
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Shares the recent-requests query, so this section costs no extra request. */
export function ActivitySection() {
  const { data, isLoading, isError, refetch } = useRecentClientRequests();

  if (isError) {
    return <SectionError message="Couldn't load recent activity." onRetry={refetch} />;
  }

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  const events = buildDashboardActivity(data?.items ?? []);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No recent activity"
        description="Activity appears here as client requests arrive."
        className="py-12"
      />
    );
  }

  return (
    <Card hover={false}>
      <Timeline events={events} />
    </Card>
  );
}
