import { useClientLeads } from "@/features/client-requests/hooks/use-client-leads";

export const RECENT_CLIENT_REQUESTS_LIMIT = 5;

/**
 * Latest client requests for the dashboard.
 *
 * Reuses the Client Requests page's own hook (and therefore its query key and
 * cache) rather than adding a parallel one — the underlying request is the same
 * GET /api/client-leads. Also doubles as the source for the "Total Client
 * Requests" KPI via meta.total, so no extra request is fired for the count.
 */
export function useRecentClientRequests() {
  return useClientLeads({ page: 1, pageSize: RECENT_CLIENT_REQUESTS_LIMIT });
}
