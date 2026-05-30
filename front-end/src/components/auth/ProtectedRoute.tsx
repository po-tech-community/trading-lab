import { useSession } from "@/hooks/use-auth";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "@/components/common/LoadingState";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component
 * Gathers session status and redirects to login if not authenticated.
 * Preserves the attempted URL to redirect back after successful login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();
  if (isLoading) {
    return <LoadingState />;
  }
  if (!isAuthenticated) {
    // Redirect to login page but save the current location they were trying to go to
    return <Navigate to="/log-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
