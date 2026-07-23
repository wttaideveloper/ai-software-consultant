import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientLeadsService } from "@/services/client-leads.service";
import type { ListClientLeadsParams } from "@/types";

export const CLIENT_LEADS_QUERY_KEY = "client-leads";

export function useClientLeads(params: ListClientLeadsParams) {
  return useQuery({
    queryKey: [CLIENT_LEADS_QUERY_KEY, "list", params],
    queryFn: () => clientLeadsService.list(params),
    staleTime: 15_000,
    // Keeps the previous page rendered while the next one loads, so paging and
    // filtering don't flash the skeleton on every keystroke.
    placeholderData: keepPreviousData,
  });
}
