import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FEATURE_LIBRARY_QUERY_KEY } from "@/features/feature-library/hooks/use-feature-library";
import { featureLibraryService } from "@/services/feature-library.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useCreateFeatureLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: featureLibraryService.create,
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_LIBRARY_QUERY_KEY, "list"] });
      toast.success(`"${item.name}" created.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't create the feature."));
    },
  });
}
