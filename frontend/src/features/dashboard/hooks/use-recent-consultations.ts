import { useQuery } from "@tanstack/react-query";
import { consultationsService } from "@/services/consultations.service";

export const RECENT_CONSULTATIONS_LIMIT = 5;

export const RECENT_CONSULTATIONS_QUERY_KEY = ["dashboard", "recent-consultations"] as const;

/**
 * Also doubles as the source for "Total Consultations" (meta.total) so the
 * dashboard doesn't fire a separate, near-identical request just for the count —
 * TanStack Query dedupes any other caller using this same hook/query key.
 */
export function useRecentConsultations() {
  return useQuery({
    queryKey: RECENT_CONSULTATIONS_QUERY_KEY,
    queryFn: () => consultationsService.list({ page: 1, pageSize: RECENT_CONSULTATIONS_LIMIT }),
    staleTime: 30_000,
  });
}
