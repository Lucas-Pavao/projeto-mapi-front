import React from 'react';
import { cn } from '@/lib/utils';
import { formatRecife } from '@/features/map/utils/datetime';
import type { RiskSummary } from '@/features/points/schemas/prediction.schema';
import type { LiveStatus } from '@/features/live/hooks/useLiveStream';
import { RISK_LEGEND_ORDER, getRiskVisual } from './risk';
import { RiskIcon } from './RiskIcon';

interface Props {
  summary: RiskSummary | undefined;
  /** Estado do stream ao vivo; omitido nas telas sem stream. */
  liveStatus?: LiveStatus;
  failed?: boolean;
  className?: string;
}

const LIVE_TEXT: Record<LiveStatus, string> = {
  open: 'Ao vivo',
  connecting: 'Conectando…',
  error: 'Sem atualização ao vivo',
  closed: 'Sem atualização ao vivo',
};

/** Contagem de pontos por nível de risco: ícone, rótulo e número (UNKNOWN nunca soma como baixo). */
export const RiskSummaryBar: React.FC<Props> = ({ summary, liveStatus, failed = false, className }) => {
  const time = formatRecife(summary?.computedAt)?.slice(-5);
  return (
    <section aria-label="Pontos por nível de risco" className={cn('flex min-h-8 items-center gap-3 rounded-2xl border py-1 border-border bg-card px-3 shadow-elevation-raised', className)}>
      {summary ? (
        <ul className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          {RISK_LEGEND_ORDER.map((level) => {
            const v = getRiskVisual(level);
            return (
              <li key={level} data-risk-count={level} className={cn('flex items-center gap-1 whitespace-nowrap text-2xs font-bold', v.text)}>
                <RiskIcon level={level} className="size-3.5 shrink-0" />
                <span>{v.label}</span>
                <span className="font-mono text-foreground">{summary[level]}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <span className="text-2xs text-muted-foreground">{failed ? 'Contagem de risco indisponível' : 'Contando pontos…'}</span>
      )}
      {(liveStatus || time) && (
        <span className="hidden shrink-0 text-2xs text-muted-foreground md:inline" data-live-status={liveStatus}>
          {liveStatus && LIVE_TEXT[liveStatus]}
          {liveStatus && time && ' · '}
          {time && `às ${time}`}
        </span>
      )}
    </section>
  );
};
