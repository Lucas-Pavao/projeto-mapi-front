import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Ticket } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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

  const switchTo = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    setError(null);
  };

  const register = mode === 'register';
  const field = 'h-[46px] w-full rounded-[10px] border border-input bg-card px-3 text-base text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';
  const tab = (m: Mode) => `mapi-press h-9 rounded-lg border-0 text-sm font-bold ${mode === m ? 'bg-card text-foreground shadow-elevation-raised' : 'bg-transparent text-muted-foreground hover:text-foreground'}`;

  return (
    <form onSubmit={handleSubmit} aria-label={register ? 'Criar conta' : 'Entrar'} className="flex w-full max-w-[25rem] flex-col gap-5">
      <div role="tablist" aria-label="Acesso" className="grid grid-cols-2 gap-1 rounded-[10px] bg-muted p-1">
        <button type="button" role="tab" aria-selected={!register} onClick={() => switchTo('login')} className={tab('login')}>Entrar</button>
        <button type="button" role="tab" aria-selected={register} onClick={() => switchTo('register')} className={tab('register')}>Criar conta</button>
      </div>
      <div>
        <h1 className="m-0 text-balance text-[26px] leading-8 font-extrabold tracking-[-0.015em] text-foreground">{register ? 'Criar uma nova conta' : 'Entrar na plataforma'}</h1>
        <p className="mt-1.5 mb-0 text-pretty text-body text-muted-foreground">
          {register ? (inviteToken ? 'O perfil já vem definido pelo convite, que vale uma vez só.' : 'A conta nasce com perfil USER. Um administrador pode promover.') : 'Use o usuário cadastrado para a sua equipe.'}
        </p>
      </div>
      {inviteToken && register && (
        <p role="status" className="mapi-enter-popover m-0 flex items-start gap-2 rounded-[10px] border border-info/40 bg-info/10 p-3 text-caption font-medium text-info">
          <Ticket className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Você chegou por um convite. Crie sua conta: o perfil já vem definido pelo convite, que vale uma vez só.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-body-strong">Usuário</label>
        <input id="username" type="text" autoComplete="username" placeholder="Seu usuário" className={field} value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-body-strong">Senha</label>
          <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword((v) => !v)} className="mapi-press min-h-6 rounded border-0 bg-transparent px-1 text-[13px] font-semibold text-primary hover:underline">{showPassword ? 'ocultar' : 'mostrar'}</button>
        </div>
        <input id="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} className={`${field} font-mono`} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {register && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-body-strong">E-mail (opcional)</label>
          <input id="email" type="email" autoComplete="email" placeholder="voce@exemplo.org" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      )}
      {error && <p role="alert" className="mapi-enter-popover m-0 rounded-[10px] border border-destructive/70 bg-destructive/10 px-3 py-2.5 text-body-strong text-destructive">{error}</p>}
      <button type="submit" disabled={isLoading} className="mapi-press flex h-12 items-center justify-center rounded-[10px] border-0 bg-primary text-[15px] font-extrabold text-primary-foreground shadow-elevation-raised hover:bg-primary/90 disabled:opacity-60">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            {register ? 'CRIANDO CONTA...' : 'ENTRANDO...'}
          </>
        ) : (register ? 'CRIAR CONTA' : 'ENTRAR')}
      </button>
      <p className="m-0 text-[13px] leading-[19px] text-muted-foreground">
        Esqueceu a senha? Ainda não disponível: fale com um administrador.{' '}
        <Link to="/minha-rua" className="text-primary underline hover:text-foreground">Ver a página pública sem entrar</Link>
      </p>
    </form>
  );
};
