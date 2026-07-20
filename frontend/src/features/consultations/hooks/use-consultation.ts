import { useQuery } from "@tanstack/react-query";
import { CONSULTATIONS_QUERY_KEY } from "@/features/consultations/hooks/use-consultations";
import { consultationsService } from "@/services/consultations.service";
import type { Consultation } from "@/types";

/**
 * `placeholder` (the object the user just clicked in the list) is shown
 * instantly while the authoritative record is fetched in the background —
 * avoids a loading flash on every selection while staying correct for
 * deep links/refreshes (where no placeholder is available).
 */
export function useConsultation(id: string | null, placeholder?: Consultation) {
  return useQuery({
    queryKey: [CONSULTATIONS_QUERY_KEY, "detail", id],
    queryFn: () => consultationsService.getById(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
    placeholderData: placeholder && placeholder.id === id ? placeholder : undefined,
  });
}
