import React from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  isGettingLocation: boolean;
  /** No celular o card de análise de local ocupa a base e já tem "Reportar alagamento aqui": o botão some. */
  hiddenOnSmall: boolean;
  onClick: () => void;
}

/** Botão flutuante: obtém a localização atual e abre o relato "esta área está alagada?". */
export const GeolocateReportButton: React.FC<Props> = ({ isGettingLocation, hiddenOnSmall, onClick }) => (
  <div className={cn('absolute bottom-6 right-16 sm:right-20 z-40 pointer-events-auto', hiddenOnSmall && 'hidden lg:block')}>
    <Button
      onClick={onClick}
      disabled={isGettingLocation}
      className={cn(
        'h-12 px-3 sm:px-5 rounded-full bg-popover border border-border shadow-elevation-overlay hover:bg-secondary hover:border-primary/50 text-foreground transition-all flex items-center gap-2 group',
        isGettingLocation ? 'text-primary border-primary/40 animate-pulse' : '',
      )}
      title="Obter minha localização atual e reportar se a área está alagada"
      aria-label={isGettingLocation ? 'Obtendo localização' : 'Reportar alagamento no local onde estou'}
    >
      {isGettingLocation ? (
        <>
          <RefreshCw className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-semibold text-primary">Obtendo localização...</span>
        </>
      ) : (
        <>
          <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="hidden sm:inline text-sm font-semibold text-foreground group-hover:text-foreground">Reportar alagamento local</span>
        </>
      )}
    </Button>
  </div>
);
