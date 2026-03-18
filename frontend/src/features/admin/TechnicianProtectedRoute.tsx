import { Navigate, useLocation } from 'react-router-dom';
import { useTechnicianAuthStore } from '../../shared/store/technicianAuthStore';

interface TechnicianProtectedRouteProps {
  children: React.ReactNode;
}

export function TechnicianProtectedRoute({ children }: TechnicianProtectedRouteProps) {
  const checkSession = useTechnicianAuthStore((s) => s.checkSession);
  const isValid = checkSession();
  const location = useLocation();

  if (!isValid) {
    return <Navigate to="/technician/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
