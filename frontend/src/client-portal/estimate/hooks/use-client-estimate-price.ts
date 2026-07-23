import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clientEstimateService } from "@/services/client-estimate.service";
import type { FeatureComplexity } from "@/types";

type LivePriceParams = {
  estimatedHours: number;
  complexity: FeatureComplexity;
  platforms: string[];
};

/**
 * Reprices the estimate for the current (toggled) hour total through the Cost
 * Engine — never the AI. The query key is the effort itself, so each distinct
 * hour total is fetched once and then served from cache when the client toggles
 * back, and `keepPreviousData` holds the last price on screen while the next one
 * loads (no flicker to a spinner between toggles).
 */
export function useClientEstimatePrice(params: LivePriceParams, enabled: boolean) {
  return useQuery({
    queryKey: [
      "client-estimate-price",
      params.estimatedHours,
      params.complexity,
      params.platforms,
    ],
    queryFn: () => clientEstimateService.price(params),
    enabled: enabled && params.estimatedHours > 0,
    placeholderData: keepPreviousData,
    // Hours + complexity + platforms fully determine the price for a session; the
    // rate card does not change mid-consultation, so a repriced total never goes
    // stale within the flow.
    staleTime: 5 * 60 * 1000,
  });
}
