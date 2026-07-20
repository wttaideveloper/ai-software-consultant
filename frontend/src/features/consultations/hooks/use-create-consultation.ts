import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CONSULTATIONS_QUERY_KEY } from "@/features/consultations/hooks/use-consultations";
import { consultationsService } from "@/services/consultations.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useCreateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: consultationsService.create,
    onSuccess: (consultation) => {
      queryClient.invalidateQueries({ queryKey: [CONSULTATIONS_QUERY_KEY, "list"] });
      toast.success(`"${consultation.title}" created.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't create the consultation."));
    },
  });
}
