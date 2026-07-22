import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientRequirementSummaryService } from "@/services/client-requirement-summary.service";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import { getApiErrorMessage } from "@/utils/api-error";

export function useGenerateClientSummary() {
  const setSummary = useClientConsultationStore((state) => state.setSummary);

  return useMutation({
    mutationFn: clientRequirementSummaryService.generate,
    onSuccess: (data) => setSummary(data.summaryMarkdown),
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Couldn't generate the requirement summary. Please try again."),
      );
    },
  });
}
