import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import MapPage from '@/pages/MapPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/map" 
            element={
              <PrivateRoute>
                <MapPage />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/map" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
