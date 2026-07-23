import { useMemo } from "react";
import { useClientLeads } from "@/features/client-requests/hooks/use-client-leads";
import { useRecentClientRequests } from "@/features/dashboard/hooks/use-recent-client-requests";

export type LeadStats = {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  closed: number;
};

/**
 * KPI counts for the Sales Dashboard.
 *
 * There is no aggregate/stats endpoint, and adding one would mean new backend
 * surface for numbers the list endpoint already returns: each count is
 * GET /api/client-leads?status=X&pageSize=1 read from meta.total, which runs the
 * existing countAll() with its status filter and ships a single row. This is the
 * same approach the previous consultation dashboard used.
 *
 * `total` is reused from useRecentClientRequests() (shared query key) instead of
 * being fetched again, so the dashboard makes five requests, not six.
 *
 * The four status hooks are called individually rather than in a loop —
 * rules-of-hooks requires a fixed call order, and the statuses are a closed set
 * mirroring the client_lead_status pgEnum.
 */
export function useLeadStats() {
  const recent = useRecentClientRequests();
  const newLeads = useClientLeads({ page: 1, pageSize: 1, status: "NEW" });
  const contacted = useClientLeads({ page: 1, pageSize: 1, status: "CONTACTED" });
  const converted = useClientLeads({ page: 1, pageSize: 1, status: "CONVERTED" });
  const closed = useClientLeads({ page: 1, pageSize: 1, status: "CLOSED" });

  const results = [recent, newLeads, contacted, converted, closed];

  const stats: LeadStats = useMemo(
    () => ({
      total: recent.data?.meta.total ?? 0,
      new: newLeads.data?.meta.total ?? 0,
      contacted: contacted.data?.meta.total ?? 0,
      converted: converted.data?.meta.total ?? 0,
      closed: closed.data?.meta.total ?? 0,
    }),
    [recent.data, newLeads.data, contacted.data, converted.data, closed.data],
  );

  return {
    stats,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    refetch: () => {
      results.forEach((result) => void result.refetch());
    },
  };
}
