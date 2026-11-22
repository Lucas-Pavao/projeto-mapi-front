import React from 'react';
import { Activity } from 'lucide-react';

/** Tela de carregamento inicial do mapa. */
export const MapLoadingOverlay: React.FC = () => (
  <div role="status" aria-live="polite" className="mapi-enter-backdrop absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-[2px]">
    <div className="mapi-enter-modal flex flex-col items-center rounded-2xl border border-border bg-popover px-8 py-7 shadow-[var(--elevation-overlay),var(--surface-highlight)]">
      <div className="relative mb-5 flex size-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary border-t-transparent [animation-duration:750ms]" />
        <Activity className="size-6 text-primary" aria-hidden="true" />
      </div>
      <h2 className="text-body-strong text-foreground">Carregando sistema</h2>
      <p className="mt-1 text-caption text-muted-foreground">MAPi · monitoramento ambiental</p>
    </div>
  </div>
);
