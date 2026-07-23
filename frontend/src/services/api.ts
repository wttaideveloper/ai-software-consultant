import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import type { ApiSuccessResponse, AuthSession } from "@/types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_LOGIN_PATH = "/api/auth/login";
const AUTH_REFRESH_PATH = "/api/auth/refresh";

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

/** Set once a request has already been replayed, so a second 401 ends the session instead of looping. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * The single in-flight refresh. Every request that 401s while one is running
 * awaits this same promise rather than starting its own — otherwise a page that
 * fires five parallel queries would send five refreshes, and since each rotates
 * the token server-side, four of them would be rejected and log the user out.
 */
let refreshPromise: Promise<string> | null = null;

async function requestNewTokens(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Bare axios, not `api`: routing this through the instance would re-enter the
  // response interceptor below and recurse the moment a refresh itself fails.
  const response = await axios.post<ApiSuccessResponse<AuthSession>>(
    `${API_BASE_URL}${AUTH_REFRESH_PATH}`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );

  const session = response.data.data;

  // The server rotates the refresh token on every use, so the new one must be
  // stored or the *next* refresh would present a token that no longer exists.
  useAuthStore.getState().setTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });

  return session.accessToken;
}

function refreshAccessToken(): Promise<string> {
  refreshPromise ??= requestNewTokens().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function endSession(): void {
  useAuthStore.getState().clearSession();
  toast.error("Your session has expired. Please log in again.");

  if (window.location.pathname !== "/admin-login") {
    window.location.assign("/admin-login");
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as RetriableConfig | undefined;
    const url = config?.url ?? "";
    const hasSession = Boolean(useAuthStore.getState().accessToken);

    // Login is the only auth entry point — a 401 from it is bad credentials, not
    // an expired session. A 401 with no session is already-logged-out noise.
    const isExpiredSession =
      status === 401 && !url.includes(AUTH_LOGIN_PATH) && hasSession;

    if (!isExpiredSession) {
      return Promise.reject(error);
    }

    // Recoverable only on the first 401 for this request, and never for the
    // refresh call itself (which can't be fixed by refreshing again).
    const canRetry =
      config !== undefined &&
      !config._retried &&
      !url.includes(AUTH_REFRESH_PATH) &&
      Boolean(useAuthStore.getState().refreshToken);

    if (!canRetry) {
      endSession();
      return Promise.reject(error);
    }

    try {
      const accessToken = await refreshAccessToken();

      config._retried = true;
      config.headers.set("Authorization", `Bearer ${accessToken}`);

      return await api.request(config);
    } catch {
      endSession();
      return Promise.reject(error);
    }
  },
);
