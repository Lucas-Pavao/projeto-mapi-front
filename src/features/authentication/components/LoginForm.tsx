import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { authService } from '../services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, User, Lock } from 'lucide-react';

type Mode = 'login' | 'register';

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
};

export const LoginForm: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = async () => {
    const response = await authService.login(username, password);
    login(response.user);
    navigate('/map');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        await authService.register({ username, password });
        // Conta criada com sucesso: já loga direto, sem obrigar a digitar tudo de novo.
        await doLogin();
      } else {
        await doLogin();
      }
    } catch (err: unknown) {
      const fallback = mode === 'register'
        ? 'Não foi possível criar a conta. Tente outro usuário.'
        : 'Falha ao fazer login. Verifique suas credenciais.';
      setError(extractErrorMessage(err, fallback));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="username"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Usuário
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              placeholder="Seu usuário"
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Senha
            </Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-white transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'register' ? 'CRIANDO CONTA...' : 'ENTRANDO...'}
            </>
          ) : (mode === 'register' ? 'CRIAR CONTA' : 'ENTRAR')}
        </Button>

        <div className="flex flex-col gap-2 items-center pt-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled
            title="Ainda não disponível — fale com um administrador para redefinir sua senha."
            className="text-muted-foreground/50 text-xs cursor-not-allowed"
          >
            Esqueceu sua senha?
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={toggleMode}
            className="text-muted-foreground hover:text-primary text-xs transition-colors"
          >
            {mode === 'register' ? 'Já tenho uma conta' : 'Criar uma nova conta'}
          </Button>
        </div>
      </form>
    </div>
  );
};
