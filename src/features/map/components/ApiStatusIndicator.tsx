import React from 'react';
import { Loader2, WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRecife } from '../utils/datetime';
import type { ApiStatus } from '../utils/apiStatus';

/** "12:30" em America/Recife ou null. Extrai a hora do formato de formatRecife. */
function timeOnly(iso: string | null | undefined): string | null {
  return formatRecife(iso)?.split(' ')[1] ?? null;
}

interface Props {
  status: ApiStatus;
  lastSuccessAt: string | null;
}

/** Indicador do cabeçalho derivado do estado real das requisições. Texto + ícone, não só cor. */
export const ApiStatusIndicator: React.FC<Props> = ({ status, lastSuccessAt }) => {
  const time = timeOnly(lastSuccessAt);
  const config = {
    loading: { Icon: Loader2, text: 'Conectando…', tone: 'text-foreground', spin: true },
    online: { Icon: Wifi, text: time ? `Online · dados das ${time}` : 'Online', tone: 'text-success', spin: false },
    error: { Icon: WifiOff, text: time ? `Sem conexão · último dado ${time}` : 'Sem conexão com a API', tone: 'text-destructive', spin: false },
  }[status];
  return (
    <div role="status" data-status={status} className={cn('flex items-center gap-2', config.tone)}>
      <config.Icon className={cn('h-3.5 w-3.5 shrink-0', config.spin && 'animate-spin')} aria-hidden="true" />
      <span className="text-2xs font-bold">{config.text}</span>
    </div>
  );
};
