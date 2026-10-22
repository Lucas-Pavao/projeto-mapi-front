import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { ThemeControls } from '@/components/layout/ThemeControls';
import logoDark from '@/assets/mapi-logo-on-dark.svg';
import logoLight from '@/assets/mapi-logo-on-light.svg';
import { LoginForm } from '@/features/authentication/components/LoginForm';
import { LoginHero } from '@/features/authentication/components/LoginHero';

export const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const expired = (useLocation().state as { expired?: boolean } | null)?.expired === true;
  // Quem já tem sessão vai direto ao mapa (menos no meio da checagem inicial).
  if (!isLoading && isAuthenticated) return <Navigate to="/map" replace />;
  return (
    <div className="grid min-h-dvh w-full grid-cols-1 bg-background text-foreground lg:grid-cols-[7fr_5fr]">
      <LoginHero />
      <main className="relative flex flex-col items-center justify-center gap-5 p-6 sm:p-12">
        <div className="absolute top-5 right-5 flex items-center gap-2"><ThemeControls /></div>
        <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-10 w-auto self-start lg:hidden" />
        {expired && (
          <p role="status" className="m-0 w-full max-w-[400px] rounded-[10px] border border-info/40 bg-info/10 p-3 text-xs font-medium text-info">
            Sua sessão expirou. Entre de novo para continuar.
          </p>
        )}
        <LoginForm />
      </main>
    </div>
  );
};

export default LoginPage;
