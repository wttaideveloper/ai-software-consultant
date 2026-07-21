import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  OrganizationSettings,
  UpdateOrganizationSettingsPayload,
  UpdateUserSettingsPayload,
  UserSettings,
} from "@/types";

export const settingsService = {
  async getOrganizationSettings(): Promise<OrganizationSettings> {
    const response = await api.get<ApiSuccessResponse<OrganizationSettings>>(
      "/api/settings/organization",
    );
    return response.data.data;
  },

  async updateOrganizationSettings(
    payload: UpdateOrganizationSettingsPayload,
  ): Promise<OrganizationSettings> {
    const response = await api.patch<ApiSuccessResponse<OrganizationSettings>>(
      "/api/settings/organization",
      payload,
    );
    return response.data.data;
  },

  async getUserSettings(): Promise<UserSettings> {
    const response = await api.get<ApiSuccessResponse<UserSettings>>("/api/settings/user");
    return response.data.data;
  },

  async updateUserSettings(payload: UpdateUserSettingsPayload): Promise<UserSettings> {
    const response = await api.patch<ApiSuccessResponse<UserSettings>>(
      "/api/settings/user",
      payload,
    );
    return response.data.data;
  },
};
