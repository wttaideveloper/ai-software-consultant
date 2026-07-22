import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientLeadService } from "@/services/client-lead.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useCreateClientLead() {
  return useMutation({
    mutationFn: clientLeadService.create,
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't submit your request. Please try again."));
    },
  });
}
