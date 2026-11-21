import React from 'react';
import { InfoTip } from '@/components/InfoTip';
import { OnlyInDetail } from '@/lib/detailMode';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import { cn } from '@/lib/utils';
import { useAlagamentoStatus } from '../hooks/useAlagamentoStatus';
import { REASON_SHORT } from '../utils/alagamentoText';
import type { FloodReason } from '../schemas/alagamento.schema';

const card = 'flex h-full min-w-0 list-none flex-col gap-1.5 rounded-2xl border border-border bg-card p-3.5 text-left text-foreground';
const dot = (ok: boolean | null) => (ok == null ? 'bg-muted-foreground' : ok ? 'bg-success' : 'bg-destructive');

/**
 * Cards da tela Dados (5.8): "IA" com rain_v1, balde, alerta e o commit do /health; "Alagamento por regressão" com o
 * último ciclo e a contagem de SEM_DADO por motivo.
 */
export const AlagamentoSourceCards: React.FC = () => {
  const q = useAlagamentoStatus();
  const s = q.data;
  const reasons = Object.entries(s?.semDadoByReason ?? {});
  const total = Object.values(s?.byLevel ?? {}).reduce((a, b) => a + b, 0);
  return (
    <>
      <li data-source="IA" className={card}>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('size-2.5 rounded-full', dot(s ? s.aiReachable : q.isError ? false : null))} />
          <span className="text-xs font-bold">{q.isLoading ? 'Lendo…' : s?.aiReachable ? 'Respondendo' : 'Sem resposta'}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-extrabold">IA<InfoTip text="Versões servidas pela MAPI AI (GET /health): previsão de chuva, balde, alerta e o commit do código." /></span>
        <dl data-testid="ia-versions" className="m-0 grid grid-cols-[auto_1fr] gap-x-2 font-mono text-[11px] leading-[15px]">
          <dt className="text-muted-foreground">chuva</dt><dd className="m-0 truncate">{s?.rainModelVersion ?? '—'}</dd>
          <dt className="text-muted-foreground">balde</dt><dd className="m-0 truncate">{s?.bucketVersion ?? '—'}</dd>
          <dt className="text-muted-foreground">commit</dt><dd className="m-0 truncate" title={s?.codeVersion ?? undefined}>{s?.codeVersion ? s.codeVersion.slice(0, 7) : '—'}{s?.codeDirty === 'true' ? ' (alterado)' : ''}</dd>
        </dl>
        <OnlyInDetail><span className="font-mono text-[11px] text-muted-foreground">alerta {s?.floodVersion ?? '—'}</span></OnlyInDetail>
      </li>
      <li data-source="ALAGAMENTO_REGRESSAO" className={card}>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('size-2.5 rounded-full', dot(s?.lastCycleAt ? reasons.length === 0 : null))} />
          <span className="text-xs font-bold">{s?.lastCycleAt ? (reasons.length ? 'Com SEM_DADO' : 'Em dia') : 'Sem ciclo'}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-extrabold">Alagamento por regressão<InfoTip text="Último ciclo do alerta por regressão (rain_v1 + balde): quando rodou e quantos pontos ficaram sem dado, por motivo. Sem dado não é sem alerta." /></span>
        <span className="font-mono text-[11px] text-muted-foreground">último ciclo {formatHoraCurta(s?.lastCycleAt) ?? '—'} · {total} pontos</span>
        <ul data-testid="sem-dado-reasons" className="m-0 list-none p-0 text-[11px] leading-[15px]">
          {reasons.length === 0 ? <li className="text-muted-foreground">nenhum SEM_DADO</li>
            : reasons.map(([r, n]) => <li key={r}><span className="font-mono font-bold">{n}</span> sem dado · {REASON_SHORT[r as FloodReason] ?? r}</li>)}
        </ul>
      </li>
    </>
  );
};
