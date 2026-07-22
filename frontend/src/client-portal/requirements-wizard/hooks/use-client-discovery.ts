import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  clientRequirementsService,
  type DiscoveryQuestionResponse,
} from "@/services/client-requirements.service";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import { getApiErrorMessage } from "@/utils/api-error";

function applyDiscoveryResult(
  data: DiscoveryQuestionResponse,
  actions: {
    addAssistantQuestion: (question: string) => void;
    setDiscoveryComplete: (value: boolean) => void;
  },
) {
  if (data.completed || !data.question) {
    actions.setDiscoveryComplete(true);
    return;
  }
  actions.addAssistantQuestion(data.question);
}

export function useStartDiscovery() {
  const addAssistantQuestion = useClientConsultationStore((state) => state.addAssistantQuestion);
  const setDiscoveryComplete = useClientConsultationStore((state) => state.setDiscoveryComplete);

  return useMutation({
    mutationFn: clientRequirementsService.start,
    onSuccess: (data) => applyDiscoveryResult(data, { addAssistantQuestion, setDiscoveryComplete }),
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Couldn't start the discovery interview. Please try again."),
      );
    },
  });
}

export function useNextDiscoveryQuestion() {
  const addUserAnswer = useClientConsultationStore((state) => state.addUserAnswer);
  const addAssistantQuestion = useClientConsultationStore((state) => state.addAssistantQuestion);
  const setDiscoveryComplete = useClientConsultationStore((state) => state.setDiscoveryComplete);

  return useMutation({
    mutationFn: clientRequirementsService.next,
    onSuccess: (data, variables) => {
      addUserAnswer(variables.currentAnswer);
      applyDiscoveryResult(data, { addAssistantQuestion, setDiscoveryComplete });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't load the next question. Please try again."));
    },
  });
}
