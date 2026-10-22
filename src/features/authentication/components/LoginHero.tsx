import React from 'react';
import { Map } from '@/components/ui/map';
import { useTheme } from '@/hooks/useTheme';
import logoDark from '@/assets/mapi-logo-on-dark.svg';
import logoLight from '@/assets/mapi-logo-on-light.svg';

/** Lado esquerdo da entrada: mapa da região escurecido (só decoração), marca e chamada. Sem dados: a tela é pública. */
export const LoginHero: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className="relative hidden overflow-hidden border-r border-border lg:block">
      <div className="absolute inset-0" aria-hidden="true">
        <Map theme={theme} center={[-34.93, -8.06]} zoom={11.8} interactive={false} attributionControl={false} />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-background/40" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-background/90 to-transparent" />
      <div className="absolute right-16 bottom-16 left-16 flex flex-col gap-4">
        <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="h-14 w-auto self-start" />
        <p className="m-0 max-w-[560px] text-[44px] leading-[48px] font-extrabold tracking-[-0.02em] text-foreground">Previsão e alerta de alagamento para o Recife.</p>
        <p className="m-0 max-w-[540px] text-base leading-6 text-muted-foreground">Chuva, rio, maré e um modelo de previsão num só mapa. Entre com o usuário da sua equipe ou veja a página pública.</p>
      </div>
    </div>
  );
};
