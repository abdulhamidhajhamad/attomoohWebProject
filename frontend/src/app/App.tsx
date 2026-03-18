import { Suspense } from 'react';
import { useRoutes, useLocation } from 'react-router-dom';
import { routes } from './routes';
import { Layout } from '../widgets/layout/Layout';
import { useLanguageDirection } from '../shared/hooks/useLanguageDirection';
import { LoadingSpinner } from '../shared/ui/LoadingSpinner/LoadingSpinner';

export function App() {
  useLanguageDirection();
  const location = useLocation();
  const routeElements = useRoutes(routes);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isTechnicianRoute = location.pathname.startsWith('/technician');

  // Admin and Technician routes have their own layout
  if (isAdminRoute || isTechnicianRoute) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {routeElements}
      </Suspense>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        {routeElements}
      </Suspense>
    </Layout>
  );
}
