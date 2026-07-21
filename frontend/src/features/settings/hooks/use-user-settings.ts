import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";

export const USER_SETTINGS_QUERY_KEY = "user-settings";

export function useUserSettings() {
  return useQuery({
    queryKey: [USER_SETTINGS_QUERY_KEY],
    queryFn: () => settingsService.getUserSettings(),
    staleTime: 30_000,
  });
}
