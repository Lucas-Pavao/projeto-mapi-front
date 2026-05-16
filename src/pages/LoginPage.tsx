import React from 'react';
import { LoginForm } from '@/features/authentication/components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">MAPI</h1>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground">Entrar na plataforma</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Insira suas credenciais para acessar o mapa
            </p>
          </div>
          
          <LoginForm />
        </div>
        
        <p className="text-center text-xs text-muted-foreground pt-4">
          &copy; {new Date().getFullYear()} MAPI Monitoramento Ambiental. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
