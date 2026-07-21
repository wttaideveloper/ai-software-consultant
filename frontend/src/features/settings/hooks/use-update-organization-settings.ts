import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ORGANIZATION_SETTINGS_QUERY_KEY } from "@/features/settings/hooks/use-organization-settings";
import { settingsService } from "@/services/settings.service";
import type { OrganizationSettings, UpdateOrganizationSettingsPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();
  const queryKey = [ORGANIZATION_SETTINGS_QUERY_KEY];

  return useMutation({
    mutationFn: (payload: UpdateOrganizationSettingsPayload) =>
      settingsService.updateOrganizationSettings(payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<OrganizationSettings>(queryKey);

      if (previous) {
        queryClient.setQueryData<OrganizationSettings>(queryKey, { ...previous, ...payload });
      }

      return { previous };
    },

    onSuccess: (settings) => {
      queryClient.setQueryData(queryKey, settings);
      toast.success("Organization settings saved.");
    },

    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getApiErrorMessage(error, "Couldn't save organization settings."));
    },
  });
}
