import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FEATURE_LIBRARY_QUERY_KEY } from "@/features/feature-library/hooks/use-feature-library";
import { featureLibraryService } from "@/services/feature-library.service";
import type { UpdateFeatureLibraryPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

type UpdateVariables = {
  id: string;
  payload: UpdateFeatureLibraryPayload;
};

export function useUpdateFeatureLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateVariables) => featureLibraryService.update(id, payload),
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_LIBRARY_QUERY_KEY, "list"] });
      toast.success(`"${item.name}" updated.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't update the feature."));
    },
  });
}
