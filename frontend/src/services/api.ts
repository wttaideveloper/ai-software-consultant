import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

function isAuthEntryRequest(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/auth/register");
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const alreadyLoggedOut = !useAuthStore.getState().accessToken;

    if (status === 401 && !isAuthEntryRequest(error.config?.url) && !alreadyLoggedOut) {
      useAuthStore.getState().clearSession();
      toast.error("Your session has expired. Please log in again.");

      if (window.location.pathname !== "/admin-login") {
        window.location.assign("/admin-login");
      }
    }

    return Promise.reject(error);
  },
);
