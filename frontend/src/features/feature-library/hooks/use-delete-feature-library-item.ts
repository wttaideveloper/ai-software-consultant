import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FEATURE_LIBRARY_QUERY_KEY } from "@/features/feature-library/hooks/use-feature-library";
import { featureLibraryService } from "@/services/feature-library.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useDeleteFeatureLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => featureLibraryService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_LIBRARY_QUERY_KEY, "list"] });
      toast.success("Feature deleted.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't delete the feature."));
    },
  });
}
