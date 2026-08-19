import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Code-splitting: MapPage puxa maplibre-gl/react-map-gl (biblioteca pesada) e não deveria
// entrar no bundle inicial de quem só está vendo a tela de login.
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const MapPage = lazy(() => import('@/pages/MapPage'));

const RouteFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
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
      <AuthProvider>
        <Router>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/map"
                element={
                  <PrivateRoute>
                    <ErrorBoundary label="o mapa">
                      <MapPage />
                    </ErrorBoundary>
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/map" />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
