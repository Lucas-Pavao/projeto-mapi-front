import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import logoDark from '@/assets/mapi-logo-on-dark.svg';
import logoLight from '@/assets/mapi-logo-on-light.svg';
import { LoginForm } from '@/features/authentication/components/LoginForm';

export const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="mb-8 flex justify-center">
          <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-10 w-auto" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-elevation-overlay">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground">Entrar na plataforma</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Insira suas credenciais para acessar o mapa
            </p>
          </div>
          
          <LoginForm />
        </div>
        
        <p className="text-center text-xs text-muted-foreground pt-4">
          &copy; {new Date().getFullYear()} MAPi. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
