import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import logoDark from '@/assets/mapi-logo-on-dark.svg';
import logoLight from '@/assets/mapi-logo-on-light.svg';
import { LoginForm } from '@/features/authentication/components/LoginForm';

export const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  // Quem já tem sessão vai direto ao mapa (menos no meio da checagem inicial).
  if (!isLoading && isAuthenticated) return <Navigate to="/map" replace />;
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="mb-8 flex justify-center">
          <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-10 w-auto" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-elevation-overlay">
          <div className="text-center mb-8">
            <h2 className="text-xl text-body-strong text-foreground">Entrar na plataforma</h2>
            <p className="text-body text-muted-foreground mt-2">
              Insira suas credenciais para acessar o mapa
            </p>
          </div>
          
          <LoginForm />
        </div>
        
        <p className="text-center text-caption text-muted-foreground pt-4">
          &copy; {new Date().getFullYear()} MAPi. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
