import { useEffect, type ReactNode } from "react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuthStore } from "@/store/auth-store";

type SessionBootstrapProps = {
  children: ReactNode;
};

/**
 * Runs once at app start: if a token was restored from storage, validates it
 * against GET /auth/me and refreshes the cached user/organization, or clears
 * the session if it's no longer valid. Gates ProtectedRoute/PublicRoute via
 * isInitializing so we never flash the login screen before this resolves.
 */
export function SessionBootstrap({ children }: SessionBootstrapProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const { data, isSuccess, isError } = useCurrentUser();

  useEffect(() => {
    if (!accessToken) {
      setInitializing(false);
      return;
    }

    if (isSuccess && data) {
      setUser(data.user, data.organization);
      setInitializing(false);
    }

    if (isError) {
      clearSession();
    }
  }, [accessToken, isSuccess, isError, data, setUser, clearSession, setInitializing]);

  return children;
}
