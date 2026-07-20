import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { featureLibraryService } from "@/services/feature-library.service";
import type { ListFeatureLibraryParams } from "@/types";

export const FEATURE_LIBRARY_QUERY_KEY = "feature-library";

export function useFeatureLibrary(params: ListFeatureLibraryParams) {
  return useQuery({
    queryKey: [FEATURE_LIBRARY_QUERY_KEY, "list", params],
    queryFn: () => featureLibraryService.list(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
