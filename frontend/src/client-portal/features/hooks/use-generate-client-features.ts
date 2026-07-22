import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientFeaturesService } from "@/services/client-features.service";
import { useClientConsultationStore, type ClientFeature } from "@/store/client-consultation.store";
import { getApiErrorMessage } from "@/utils/api-error";

function generateId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useGenerateClientFeatures() {
  const setFeatures = useClientConsultationStore((state) => state.setFeatures);

  return useMutation({
    mutationFn: clientFeaturesService.generate,
    onSuccess: (data) => {
      const features: ClientFeature[] = data.features.map((feature) => ({
        ...feature,
        id: generateId(),
      }));
      setFeatures(features);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't detect features. Please try again."));
    },
  });
}
