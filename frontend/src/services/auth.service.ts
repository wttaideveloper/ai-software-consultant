import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  AuthSession,
  CurrentUserResponse,
  LoginPayload,
} from "@/types";

/** No register endpoint: POST /api/auth/register is not mounted server-side. */
const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/login",
  ME: "/api/auth/me",
} as const;

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const response = await api.post<ApiSuccessResponse<AuthSession>>(
      AUTH_ENDPOINTS.LOGIN,
      payload,
    );
    return response.data.data;
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response = await api.get<ApiSuccessResponse<CurrentUserResponse>>(
      AUTH_ENDPOINTS.ME,
    );
    return response.data.data;
  },
};
