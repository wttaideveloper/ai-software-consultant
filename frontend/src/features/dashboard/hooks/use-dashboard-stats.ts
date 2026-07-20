import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { consultationsService } from "@/services/consultations.service";
import { useRecentConsultations } from "@/features/dashboard/hooks/use-recent-consultations";
import type { ConsultationStatus } from "@/types";

const STATUS_COUNT_QUERIES: Array<{ key: string; status: ConsultationStatus }> = [
  { key: "active", status: "in_progress" },
  { key: "completed", status: "completed" },
  { key: "draft", status: "draft" },
];

export type DashboardStats = {
  total: number;
  active: number;
  completed: number;
  draft: number;
};

/**
 * All counts come from GET /api/consultations?status=X&pageSize=1, reading
 * meta.total — the only aggregate the backend exposes. "total" is reused from
 * useRecentConsultations() rather than fetched again (shared query cache).
 */
export function useDashboardStats() {
  const recent = useRecentConsultations();

  const statusResults = useQueries({
    queries: STATUS_COUNT_QUERIES.map(({ key, status }) => ({
      queryKey: ["dashboard", "consultation-count", key],
      queryFn: () => consultationsService.list({ page: 1, pageSize: 1, status }),
      staleTime: 30_000,
    })),
  });

  const [activeResult, completedResult, draftResult] = statusResults;

  const stats: DashboardStats = useMemo(
    () => ({
      total: recent.data?.meta.total ?? 0,
      active: activeResult.data?.meta.total ?? 0,
      completed: completedResult.data?.meta.total ?? 0,
      draft: draftResult.data?.meta.total ?? 0,
    }),
    [recent.data, activeResult.data, completedResult.data, draftResult.data],
  );

  const isLoading = recent.isLoading || statusResults.some((result) => result.isLoading);
  const isError = recent.isError || statusResults.some((result) => result.isError);

  const refetch = () => {
    void recent.refetch();
    statusResults.forEach((result) => void result.refetch());
  };

  return { stats, isLoading, isError, refetch };
}
