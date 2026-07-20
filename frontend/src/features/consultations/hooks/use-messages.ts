import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "@/services/conversations.service";

export const MESSAGES_QUERY_KEY = "consultation-messages";

export function useMessages(consultationId: string | null) {
  return useQuery({
    queryKey: [MESSAGES_QUERY_KEY, consultationId],
    queryFn: () => conversationsService.listMessages(consultationId as string),
    enabled: Boolean(consultationId),
    staleTime: 10_000,
  });
}
