import React from 'react';
import { Check, CircleHelp, Minus, X } from 'lucide-react';
import type { ComponentType } from 'react';
import { QueryState } from '@/components/ui/query-state';
import { CEMADEN_ATTRIBUTION } from '@/features/sensors/schemas/station.schema';
import { MONTH_STATUS_TEXT, REASON_TEXT } from '@/features/points/utils/rainCandidates';
import type { MonthStatus } from '@/features/points/schemas/rain-candidates.schema';
import { cn } from '@/lib/utils';
import { useMonthChecks } from '../hooks/useAdminData';

const CELL: Record<MonthStatus, { Icon: ComponentType<{ className?: string }>; cls: string }> = {
  OK: { Icon: Check, cls: 'border-success/50 bg-success/10 text-success' },
  UNCHECKED: { Icon: CircleHelp, cls: 'border-warning/50 bg-warning/10 text-warning' },
  FAIL: { Icon: X, cls: 'border-destructive/50 bg-destructive/10 text-destructive' },
  OFFLINE: { Icon: Minus, cls: 'border-border bg-muted text-muted-foreground' },
};

const monthLabel = (iso: string) => new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(iso)).replace('.', '');

/** Grade estação × mês da checagem espacial (regra vigente do ADR 0022). Ícone e texto acompanham a cor. */
export const MonthGrid: React.FC = () => {
  const query = useMonthChecks();
  return (
    <section aria-label="Checagem das estações por mês" className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-card p-4" data-testid="month-grid">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-[12px] font-bold uppercase leading-4 tracking-[0.06em] text-muted-foreground">Estações Cemaden PED × mês</h2>
        {query.data?.ruleVersion && <span className="font-mono text-[11px] text-muted-foreground">regra {query.data.ruleVersion}</span>}
      </div>
      <QueryState query={query} what="a grade de estações" emptyTitle="Nenhuma estação checada.">
        {(d) => d.stations.length === 0 ? <p className="m-0 text-[13px] text-muted-foreground">Nenhuma estação checada no período.</p> : (
          <div className="overflow-x-auto">
            <table className="border-collapse text-[11px]">
              <caption className="sr-only">Estado da checagem de cada estação em cada mês</caption>
              <thead>
                <tr><th scope="col" className="pr-3 text-left font-bold text-muted-foreground">Estação</th>{d.months.map((m) => <th key={m} scope="col" className="px-0.5 pb-1 font-mono font-bold text-muted-foreground">{monthLabel(m)}</th>)}</tr>
              </thead>
              <tbody>
                {d.stations.map((s) => (
                  <tr key={s.stationId}>
                    <th scope="row" className="whitespace-nowrap py-0.5 pr-3 text-left font-semibold">{s.name || s.stationId}</th>
                    {d.months.map((m) => {
                      const c = s.cells.find((x) => x.monthStartUtc === m);
                      if (!c) return <td key={m} className="px-0.5 py-0.5"><span aria-label="sem checagem registrada" className="flex h-6 min-w-9 items-center justify-center rounded border border-dashed border-border text-muted-foreground">·</span></td>;
                      const { Icon, cls } = CELL[c.status];
                      const text = `${MONTH_STATUS_TEXT[c.status]}${c.reasons.length ? `: ${c.reasons.map((r) => REASON_TEXT[r] ?? r).join(', ')}` : ''}`;
                      return (
                        <td key={m} className="px-0.5 py-0.5">
                          <span data-status={c.status} title={text} aria-label={`${s.name || s.stationId}, ${monthLabel(m)}: ${text}`} className={cn('flex h-6 min-w-9 items-center justify-center rounded border', cls)}>
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryState>
      <p className="m-0 text-[11px] leading-[15px] text-muted-foreground">
        <Check className="inline size-3" aria-hidden="true" /> mês OK · <CircleHelp className="inline size-3" aria-hidden="true" /> sem checagem (usada) · <X className="inline size-3" aria-hidden="true" /> reprovada (fora da chuva do ponto) · <Minus className="inline size-3" aria-hidden="true" /> offline. {CEMADEN_ATTRIBUTION}.
      </p>
    </section>
  );
};
