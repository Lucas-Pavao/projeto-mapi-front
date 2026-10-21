import React from 'react';
import { cn } from '@/lib/utils';
import { formatRecife } from '@/features/map/utils/datetime';
import type { IngestionSource } from '../schemas/admin.schema';
import { INGESTION_STATUS } from '../utils/ingestion';

interface Props {
  source: IngestionSource;
  onShowRuns: (source: string) => void;
}

export const SourceCard: React.FC<Props> = ({ source: s, onShowRuns }) => {
  const st = INGESTION_STATUS[s.status];
  return (
    <li data-source={s.source} data-status={s.status} className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-reading text-foreground">{s.source}</p>
        <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-2xs font-bold', st.tone)}>
          <st.Icon className="size-3.5" aria-hidden="true" /> {st.label}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-caption">
        <div><dt className="text-muted-foreground">Último sucesso</dt><dd className="text-foreground">{formatRecife(s.lastSuccessAt) ?? 'nunca'}</dd></div>
        <div><dt className="text-muted-foreground">Esperado a cada</dt><dd className="text-foreground">{s.expectedEveryMinutes != null ? `${s.expectedEveryMinutes} min` : '—'}</dd></div>
        <div><dt className="text-muted-foreground">Linhas em 24 h</dt><dd className="text-reading text-foreground">{s.rowsLast24h ?? '—'}</dd></div>
      </dl>
      {s.lastError && <p className="break-words text-caption text-destructive">Último erro: {s.lastError}</p>}
      <button type="button" onClick={() => onShowRuns(s.source)} className="mt-1 flex h-11 w-fit items-center text-body-strong text-primary hover:underline md:h-6" aria-label={`Ver execuções de ${s.source}`}>
        Ver execuções{s.lastRunId ? ` (última ${s.lastRunId.slice(0, 8)})` : ''}
      </button>
    </li>
  );
};
