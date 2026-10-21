import React from 'react';
import { cn } from '@/lib/utils';
import type { IngestionSource } from '../schemas/admin.schema';
import { INGESTION_STATUS, SOURCE_INFO, STATUS_COLOR, agoText, elapsedFraction, everyText } from '../utils/ingestion';

interface Props {
  source: IngestionSource;
  now: number;
  onShowRuns: (source: string) => void;
}

/** Cartão de uma fonte: estado (ponto + rótulo + ícone), nome, o que traz, progresso do ciclo e última coleta. */
export const SourceCard: React.FC<Props> = ({ source: s, now, onShowRuns }) => {
  const st = INGESTION_STATUS[s.status];
  const info = SOURCE_INFO[s.source] ?? { name: s.source, what: '' };
  const color = STATUS_COLOR[s.status];
  const frac = elapsedFraction(s.lastSuccessAt, s.expectedEveryMinutes, now);
  const problem = s.status === 'DELAYED' || s.status === 'FAILING' || s.status === 'QUARANTINED';
  return (
    <li data-source={s.source} data-status={s.status} className="list-none">
      <button
        type="button"
        onClick={() => onShowRuns(s.source)}
        aria-label={`Ver execuções de ${s.source}`}
        className={cn('flex h-full w-full flex-col gap-1.5 rounded-2xl border bg-card p-3.5 text-left text-foreground', problem ? 'border-current' : 'border-border')}
        style={problem ? { color } : undefined}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: color }} />
          <span className={cn('text-xs font-bold', problem ? '' : 'text-foreground')}>{st.label}</span>
        </span>
        <span className="block text-sm leading-[18px] font-extrabold text-foreground">{info.name}</span>
        <span className="block min-h-4 text-xs leading-4 text-muted-foreground">{info.what}</span>
        <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full" style={{ width: `${Math.round((frac ?? 1) * 100)}%`, background: color }} /></span>
        <span className="flex justify-between gap-2 whitespace-nowrap font-mono text-[11px] leading-[14px] text-muted-foreground"><span>última {agoText(s.lastSuccessAt, now)}</span><span>{everyText(s.expectedEveryMinutes)}</span></span>
        {s.lastError && <span className="block break-words text-[11px] leading-[14px] text-destructive">Último erro: {s.lastError}</span>}
        {s.lastRunId && <span className="sr-only">Última execução {s.lastRunId.slice(0, 8)}</span>}
      </button>
    </li>
  );
};
