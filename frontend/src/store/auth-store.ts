import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { AuthSession, Organization, User } from "@/types";

const AUTH_STORAGE_KEY = "asc-auth";

/**
 * "Remember me" controls whether the session survives a browser restart
 * (localStorage) or only the current tab (sessionStorage). The login form
 * calls setAuthStoragePreference() before triggering the login mutation.
 */
let storagePreference: "local" | "session" = "local";

export function setAuthStoragePreference(preference: "local" | "session") {
  storagePreference = preference;
}

const dualStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name, value) => {
    if (storagePreference === "local") {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

type AuthState = {
  accessToken: string | null;
  /**
   * Long-lived credential used to silently mint a new access token when the
   * short-lived one expires. Persisted alongside the access token — without it
   * the session would hard-expire at ACCESS_TOKEN_EXPIRES (15m) and dump the
   * user back on the login screen mid-task.
   */
  refreshToken: string | null;
  user: User | null;
  organization: Organization | null;
  /** True until the initial session-restore check (GET /auth/me) resolves. */
  isInitializing: boolean;
  setSession: (session: AuthSession) => void;
  /** Applies a rotated token pair from POST /auth/refresh, leaving user/org untouched. */
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: User, organization: Organization) => void;
  setInitializing: (value: boolean) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      organization: null,
      isInitializing: true,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          organization: session.organization,
          isInitializing: false,
        }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setUser: (user, organization) => set({ user, organization }),
      setInitializing: (value) => set({ isInitializing: value }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          organization: null,
          isInitializing: false,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => dualStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        organization: state.organization,
      }),
    },
  ),
);

export const selectIsAuthenticated = (state: AuthState) => Boolean(state.accessToken);
