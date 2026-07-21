import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { USER_SETTINGS_QUERY_KEY } from "@/features/settings/hooks/use-user-settings";
import { settingsService } from "@/services/settings.service";
import { useThemeStore } from "@/store/theme-store";
import type { UpdateUserSettingsPayload, UserSettings, UserTheme } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

/**
 * The app's live theme mechanism (theme-store.ts) only supports "light"/"dark".
 * "system" is a real backend-supported value with no direct equivalent there,
 * so it's resolved once against the OS preference at save time — not
 * live-reactive to later OS theme changes.
 */
function resolveAppliedTheme(theme: UserTheme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const queryKey = [USER_SETTINGS_QUERY_KEY];

  return useMutation({
    mutationFn: (payload: UpdateUserSettingsPayload) =>
      settingsService.updateUserSettings(payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UserSettings>(queryKey);

      if (previous) {
        queryClient.setQueryData<UserSettings>(queryKey, { ...previous, ...payload });
      }

      return { previous };
    },

    onSuccess: (settings) => {
      queryClient.setQueryData(queryKey, settings);
      useThemeStore.getState().setTheme(resolveAppliedTheme(settings.theme));
      toast.success("Your settings were saved.");
    },

    onError: (error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getApiErrorMessage(error, "Couldn't save your settings."));
    },
  });
}
