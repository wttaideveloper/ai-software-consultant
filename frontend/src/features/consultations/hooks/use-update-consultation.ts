import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CONSULTATIONS_QUERY_KEY } from "@/features/consultations/hooks/use-consultations";
import { consultationsService } from "@/services/consultations.service";
import type { UpdateConsultationPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

type UpdateVariables = {
  id: string;
  payload: UpdateConsultationPayload;
};

export function useUpdateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateVariables) => consultationsService.update(id, payload),
    onSuccess: (consultation) => {
      queryClient.invalidateQueries({ queryKey: [CONSULTATIONS_QUERY_KEY, "list"] });
      queryClient.invalidateQueries({
        queryKey: [CONSULTATIONS_QUERY_KEY, "detail", consultation.id],
      });
      toast.success(`"${consultation.title}" updated.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't update the consultation."));
    },
  });
}
