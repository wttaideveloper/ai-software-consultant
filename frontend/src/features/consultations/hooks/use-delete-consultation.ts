import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CONSULTATIONS_QUERY_KEY } from "@/features/consultations/hooks/use-consultations";
import { consultationsService } from "@/services/consultations.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useDeleteConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => consultationsService.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [CONSULTATIONS_QUERY_KEY, "list"] });
      queryClient.removeQueries({ queryKey: [CONSULTATIONS_QUERY_KEY, "detail", id] });
      toast.success("Consultation deleted.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't delete the consultation."));
    },
  });
}
