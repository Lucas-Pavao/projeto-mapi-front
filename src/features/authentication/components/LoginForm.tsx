import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { authService } from '../services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, User, Lock } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(username, password);
      login(response.user, response.token);
      navigate('/map');
    } catch (err: unknown) {
      let errorMsg = 'Falha ao fazer login. Verifique suas credenciais.';
      
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
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
              ENTRANDO...
            </>
          ) : 'ENTRAR'}
        </Button>

        <div className="flex flex-col gap-2 items-center pt-2">
          <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary text-xs transition-colors">
            Esqueceu sua senha?
          </Button>
          <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary text-xs transition-colors">
            Criar uma nova conta
          </Button>
        </div>
      </form>
    </div>
  );
};
