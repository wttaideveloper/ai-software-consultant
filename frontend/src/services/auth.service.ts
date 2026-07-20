import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  AuthSession,
  CurrentUserResponse,
  LoginPayload,
  RegisterPayload,
} from "@/types";

const AUTH_ENDPOINTS = {
  REGISTER: "/api/auth/register",
  LOGIN: "/api/auth/login",
  ME: "/api/auth/me",
} as const;

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthSession> {
    const response = await api.post<ApiSuccessResponse<AuthSession>>(
      AUTH_ENDPOINTS.REGISTER,
      payload,
    );
    return response.data.data;
  },

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
