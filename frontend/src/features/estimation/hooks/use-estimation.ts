import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { estimationService } from "@/services/estimation.service";

export const ESTIMATION_QUERY_KEY = "estimation";

/** `data === null` means no estimation generated yet (a 404 treated as a valid empty state). */
export function useEstimation(consultationId: string | null) {
  return useQuery({
    queryKey: [ESTIMATION_QUERY_KEY, consultationId],
    queryFn: async () => {
      try {
        return await estimationService.get(consultationId as string);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(consultationId),
    staleTime: 15_000,
  });
}
