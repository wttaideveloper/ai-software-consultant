import { useQuery } from "@tanstack/react-query";
import { CLIENT_LEADS_QUERY_KEY } from "@/features/client-requests/hooks/use-client-leads";
import { clientLeadsService } from "@/services/client-leads.service";

export function useClientLead(leadId: string | undefined) {
  return useQuery({
    queryKey: [CLIENT_LEADS_QUERY_KEY, "detail", leadId],
    // `enabled` below guarantees leadId is defined by the time this runs.
    queryFn: () => clientLeadsService.getById(leadId as string),
    enabled: Boolean(leadId),
    staleTime: 15_000,
  });
}
