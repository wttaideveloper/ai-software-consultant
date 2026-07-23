import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { costSettingsService } from "@/services/cost-settings.service";
import type {
  ComplexityMultiplier,
  CostConfiguration,
  HourlyRate,
  PlatformMultiplier,
  PreviewCostParams,
  UpdateCostSettingsPayload,
} from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

export const COST_SETTINGS_QUERY_KEY = "cost-settings";

export function useCostConfiguration() {
  return useQuery({
    queryKey: [COST_SETTINGS_QUERY_KEY, "configuration"],
    queryFn: costSettingsService.getConfiguration,
    // Rates change rarely and every quote depends on them, so a slightly longer
    // window than the app default is safe and keeps the preview snappy.
    staleTime: 60_000,
  });
}

/**
 * Live calculator.
 *
 * `enabled` lets the caller withhold the request until the inputs are valid —
 * previewing a half-typed rate would flash a nonsense price. `placeholderData`
 * keeps the previous figures on screen while the next calculation is in flight,
 * so the card doesn't blank on every keystroke.
 */
export function useCostPreview(params: PreviewCostParams, enabled = true) {
  return useQuery({
    queryKey: [COST_SETTINGS_QUERY_KEY, "preview", params],
    queryFn: () => costSettingsService.preview(params),
    enabled,
    staleTime: 0,
    placeholderData: (previous) => previous,
  });
}

/**
 * Saves the whole rate card.
 *
 * One mutation rather than four buttons: the page has a single Save, and the
 * four endpoints are applied in sequence so a validation failure on, say, the
 * multipliers leaves the earlier writes already applied — which the toast says
 * plainly rather than pretending the save was atomic. (Cross-table atomicity
 * would need a single composite endpoint; the four resource endpoints are the
 * documented API.)
 */
export function useSaveCostConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      settings?: UpdateCostSettingsPayload;
      hourlyRates?: HourlyRate[];
      complexityMultipliers?: ComplexityMultiplier[];
      platformMultipliers?: PlatformMultiplier[];
    }) => {
      if (input.hourlyRates?.length) {
        await costSettingsService.updateHourlyRates(input.hourlyRates);
      }
      if (input.complexityMultipliers?.length) {
        await costSettingsService.updateComplexityMultipliers(
          input.complexityMultipliers,
        );
      }
      if (input.platformMultipliers?.length) {
        await costSettingsService.updatePlatformMultipliers(
          input.platformMultipliers,
        );
      }
      if (input.settings && Object.keys(input.settings).length > 0) {
        await costSettingsService.updateSettings(input.settings);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COST_SETTINGS_QUERY_KEY] });
      toast.success("Pricing rules saved. New estimates use them immediately.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't save the pricing rules."));
    },
  });
}

export type { CostConfiguration };
