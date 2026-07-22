import { Navigate, Outlet } from "react-router-dom";
import { PageLoader } from "@/components/ui/spinner";
import { selectIsAuthenticated, useAuthStore } from "@/store/auth-store";

export function PublicRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
