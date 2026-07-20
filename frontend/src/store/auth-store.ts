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
  user: User | null;
  organization: Organization | null;
  /** True until the initial session-restore check (GET /auth/me) resolves. */
  isInitializing: boolean;
  setSession: (session: AuthSession) => void;
  setUser: (user: User, organization: Organization) => void;
  setInitializing: (value: boolean) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      organization: null,
      isInitializing: true,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          user: session.user,
          organization: session.organization,
          isInitializing: false,
        }),
      setUser: (user, organization) => set({ user, organization }),
      setInitializing: (value) => set({ isInitializing: value }),
      clearSession: () =>
        set({ accessToken: null, user: null, organization: null, isInitializing: false }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => dualStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        organization: state.organization,
      }),
    },
  ),
);

export const selectIsAuthenticated = (state: AuthState) => Boolean(state.accessToken);
