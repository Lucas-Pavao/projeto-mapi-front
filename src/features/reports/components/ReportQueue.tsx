import React from 'react';
import { Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import type { FloodReport, ReportStatus } from '../schemas/report.schema';
import { WATER_DEPTH_LABEL } from '../utils/labels';

export type QueueTab = ReportStatus | 'ALL';
export const TABS: ReadonlyArray<{ value: QueueTab; label: string }> = [
  { value: 'PENDING', label: 'Aguardando' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'DISCARDED', label: 'Descartados' },
  { value: 'ALL', label: 'Todos' },
];
export const STATUS_TEXT: Record<ReportStatus, { label: string; tone: string }> = {
  PENDING: { label: 'aguardando', tone: 'text-warning' },
  CONFIRMED: { label: 'confirmado', tone: 'text-success' },
  DISCARDED: { label: 'descartado', tone: 'text-muted-foreground' },
};

interface Props {
  items: FloodReport[];
  names: ReadonlyMap<string, string>;
  selected: number | null;
  tab: QueueTab;
  counts: Record<QueueTab, number>;
  onTab: (t: QueueTab) => void;
  onPick: (id: number) => void;
}

/** Fila: abas em pílula com contagem e uma linha por relato (local, altura da água e hora). Texto do morador é só texto. */
export const ReportQueue: React.FC<Props> = ({ items, names, selected, tab, counts, onTab, onPick }) => (
  <section aria-label="Fila" className="flex min-h-[320px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:col-span-5 lg:min-h-0">
    <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-1.5 border-b border-border px-3.5 py-3">
      {TABS.map((t) => (
        <button
          key={t.value} type="button" aria-pressed={tab === t.value} onClick={() => onTab(t.value)}
          className={cn('h-11 cursor-pointer rounded-full border px-3 text-[12px] font-bold leading-4 md:h-[30px]', tab === t.value ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent text-foreground')}
        >
          {t.label} <span className="font-mono">{counts[t.value]}</span>
        </button>
      ))}
    </div>
    <ul aria-label="Relatos" className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto p-2">
      {items.map((r) => {
        const st = STATUS_TEXT[r.status];
        const where = r.nearestPointSlug ? (names.get(r.nearestPointSlug) ?? r.nearestPointSlug) : 'Sem ponto crítico por perto';
        return (
          <li key={r.id} data-report-id={r.id} data-status={r.status}>
            <button
              type="button" aria-pressed={r.id === selected} onClick={() => onPick(r.id)}
              className={cn('flex w-full cursor-pointer items-start gap-3 rounded-xl border-0 p-2.5 text-left text-foreground hover:bg-muted', r.id === selected ? 'bg-secondary' : 'bg-transparent')}
            >
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-info/20 text-info"><Droplets className="size-[18px]" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold leading-5">Relato #{r.id} · {where}</span>
                <span className="block truncate text-[12px] leading-4 text-muted-foreground">
                  {r.waterDepth ? WATER_DEPTH_LABEL[r.waterDepth] : 'Altura da água não informada'}{r.description ? ` · “${r.description}”` : ''}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="font-mono text-[12px] font-semibold text-muted-foreground">{formatHoraCurta(r.observedAt) ?? '—'}</span>
                <span className={cn('text-[11px] font-bold', st.tone)}>{st.label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  </section>
);
