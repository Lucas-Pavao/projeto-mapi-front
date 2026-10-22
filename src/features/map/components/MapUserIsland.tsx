import React from 'react';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  username: string | undefined;
  onLogout: () => void;
}

/** Ilha flutuante com o usuário e o botão Sair (some no celular; lá o Sair fica no menu). */
export const MapUserIsland: React.FC<Props> = ({ username, onLogout }) => (
  <div className="absolute top-4 right-4 z-40 pointer-events-auto max-[640px]:hidden">
    <div className="h-16 border border-border bg-card flex items-center gap-3 px-4 rounded-2xl shadow-elevation-overlay transition-all">
      <div className="flex flex-col items-end mr-1 hidden sm:flex">
        <span className="text-2xs font-bold text-foreground">{username || 'Convidado'}</span>
      </div>
      <div aria-hidden="true" className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group">
        <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onLogout}
        aria-label="Sair da conta"
        title="Sair da conta"
        className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all border border-transparent hover:border-destructive/40"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  </div>
);
