import React from 'react';
import { RefreshCw, TriangleAlert, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lastValidText } from '../utils/apiStatus';

interface ErrorProps {
  lastSuccessAt: string | null;
  isRetrying: boolean;
  onRetry: () => void;
}

/** Aviso visível quando a API cai ou o polling falha. Mantém os últimos dados no mapa. */
export const ApiErrorBanner: React.FC<ErrorProps> = ({ lastSuccessAt, isRetrying, onRetry }) => (
  <div role="alert" className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-popover px-3 py-2 text-sm text-foreground shadow-elevation-overlay md:flex-wrap md:gap-3 md:px-4 md:py-3">
    <TriangleAlert className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold md:text-sm">Não foi possível atualizar os dados.</p>
      <p className="text-2xs text-foreground md:text-xs">
        {lastValidText(lastSuccessAt)}.<span className="sr-only md:not-sr-only"> Os valores no mapa podem estar desatualizados.</span>
      </p>
    </div>
    <Button type="button" size="sm" variant="secondary" onClick={onRetry} disabled={isRetrying} aria-label={isRetrying ? 'Tentando de novo' : 'Tentar de novo'}>
      <RefreshCw className={isRetrying ? 'animate-spin' : ''} aria-hidden="true" />
      <span className="sr-only md:not-sr-only">{isRetrying ? 'Tentando…' : 'Tentar de novo'}</span>
    </Button>
  </div>
);

/** Estado vazio explícito: a API respondeu, mas não há pontos nem sensores. */
export const EmptyDataNotice: React.FC = () => (
  <div role="status" className="flex items-center gap-3 rounded-2xl border border-border bg-popover px-4 py-3 text-sm text-foreground shadow-elevation-overlay">
    <Inbox className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
    <p>
      <strong>Nenhum ponto crítico ou sensor retornado pela API.</strong>{' '}
      <span className="text-foreground">O mapa está vazio por falta de dados, não por ausência de risco.</span>
    </p>
  </div>
);
