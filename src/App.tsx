import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';

// Code-splitting: MapPage puxa maplibre-gl/react-map-gl (biblioteca pesada) e não deveria
// entrar no bundle inicial de quem só está vendo a tela de login.
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const PointPage = lazy(() => import('@/pages/PointPage'));
const SensorsPage = lazy(() => import('@/pages/SensorsPage'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
const ModelPage = lazy(() => import('@/pages/ModelPage'));
const SimulatorPage = lazy(() => import('@/pages/SimulatorPage'));
const TidePage = lazy(() => import('@/pages/TidePage'));
const AdminDataPage = lazy(() => import('@/pages/AdminDataPage'));
const AdminPointsPage = lazy(() => import('@/pages/AdminPointsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const ReportPage = lazy(() => import('@/pages/ReportPage'));
const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'));
const MyStreetPage = lazy(() => import('@/pages/MyStreetPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

const RouteFallback = () => (
  <div role="status" className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
    Carregando...
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  // Enquanto a checagem inicial de sessão (/api/auth/me) ainda está em voo, não redireciona —
  // senão todo F5 na página do mapa manda o usuário de volta pro login por uma fração de
  // segundo, mesmo com uma sessão válida.
  if (isLoading) return <RouteFallback />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<PublicLayout />}>
                  <Route path="/minha-rua" element={<MyStreetPage />} />
                </Route>
                <Route
                  element={
                    <PrivateRoute>
                      <AppLayout />
                    </PrivateRoute>
                  }
                >
                  <Route
                    path="/map"
                    element={
                      <ErrorBoundary label="o mapa">
                        <MapPage />
                      </ErrorBoundary>
                    }
                  />
                  <Route path="/pontos/:slug" element={<PointPage />} />
                  <Route path="/sensores" element={<SensorsPage />} />
                  <Route path="/alertas" element={<AlertsPage />} />
                  <Route path="/eventos" element={<EventsPage />} />
                  <Route path="/modelo" element={<ModelPage />} />
                  <Route path="/modelo/simulador" element={<SimulatorPage />} />
                  <Route path="/mare" element={<TidePage />} />
                  <Route path="/admin/dados" element={<AdminDataPage />} />
                  <Route path="/admin/pontos" element={<AdminPointsPage />} />
                  <Route path="/relatos" element={<ReportsPage />} />
                  <Route path="/relatorio" element={<ReportPage />} />
                  <Route path="/admin/usuarios" element={<AdminUsersPage />} />
                </Route>
                <Route path="/" element={<Navigate to="/map" />} />
                <Route path="*" element={<Navigate to="/map" />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
