import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { consultationsService } from "@/services/consultations.service";
import type { ListConsultationsParams } from "@/types";

export const CONSULTATIONS_QUERY_KEY = "consultations";

export function useConsultations(params: ListConsultationsParams) {
  return useQuery({
    queryKey: [CONSULTATIONS_QUERY_KEY, "list", params],
    queryFn: () => consultationsService.list(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
