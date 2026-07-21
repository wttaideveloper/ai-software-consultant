import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";

export const ORGANIZATION_SETTINGS_QUERY_KEY = "organization-settings";

export function useOrganizationSettings() {
  return useQuery({
    queryKey: [ORGANIZATION_SETTINGS_QUERY_KEY],
    queryFn: () => settingsService.getOrganizationSettings(),
    staleTime: 30_000,
  });
}
