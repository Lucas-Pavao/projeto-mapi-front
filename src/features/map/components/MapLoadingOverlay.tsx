import React from 'react';
import { Activity } from 'lucide-react';

/** Tela de carregamento inicial do mapa. */
export const MapLoadingOverlay: React.FC = () => (
  <div role="status" aria-live="polite" className="absolute inset-0 bg-background flex items-center justify-center z-50">
    <div className="flex flex-col items-center p-8 rounded-xl bg-popover border border-border shadow-elevation-overlay">
      <div className="relative h-16 w-16 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <Activity className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <h2 className="text-sm font-bold text-foreground animate-pulse">Carregando sistema</h2>
      <p className="text-2xs text-muted-foreground mt-2 font-medium">MAPi · monitoramento ambiental</p>
    </div>
  </div>
);
