import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { authService } from '../services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, User, Lock, Mail, Ticket } from 'lucide-react';
import { authErrorMessage, type AuthMode } from '../utils/authErrors';

type Mode = AuthMode;

export const LoginForm: React.FC = () => {
  // Convite: /login?convite=TOKEN abre o cadastro. O token fica só em memória; sai da URL (histórico) na hora.
  const [params] = useSearchParams();
  const [inviteToken] = useState<string | null>(() => params.get('convite')?.trim() || null);
  const [mode, setMode] = useState<Mode>(inviteToken ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (inviteToken) navigate('/login', { replace: true });
  }, [inviteToken, navigate]);

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
        await authService.register({ username, password, ...(email.trim() ? { email: email.trim() } : {}), ...(inviteToken ? { inviteToken } : {}) });
        // Conta criada com sucesso: já loga direto, sem obrigar a digitar tudo de novo.
        await doLogin();
      } else {
        await doLogin();
      }
    } catch (err: unknown) {
      setError(authErrorMessage(err, mode, inviteToken !== null));
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
      <form onSubmit={handleSubmit} className="space-y-4" aria-label={mode === 'register' ? 'Criar conta' : 'Entrar'}>
        {inviteToken && mode === 'register' && (
          <p role="status" className="flex items-start gap-2 rounded-lg border border-info/40 bg-info/10 p-3 text-xs font-medium text-info">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Você chegou por um convite. Crie sua conta: o perfil já vem definido pelo convite, que vale uma vez só.
          </p>
        )}
        <div className="space-y-2">
          <Label
            htmlFor="username"
            className="text-xs font-semibold text-muted-foreground"
          >
            Usuário
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="username"
              type="text"
              autoComplete="username"
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
              className="text-xs font-semibold text-muted-foreground"
            >
              Senha
            </Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">E-mail (opcional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.org"
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/20"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.98]"
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
