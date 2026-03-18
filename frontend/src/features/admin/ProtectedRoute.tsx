import { Navigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../shared/store/adminStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const checkSession = useAdminStore((s) => s.checkSession);
  const isValid = checkSession();
  const location = useLocation();

  if (!isValid) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
