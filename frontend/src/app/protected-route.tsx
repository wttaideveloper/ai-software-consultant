import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PageLoader } from "@/components/ui/spinner";
import { selectIsAuthenticated, useAuthStore } from "@/store/auth-store";

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const location = useLocation();

  if (isInitializing) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
