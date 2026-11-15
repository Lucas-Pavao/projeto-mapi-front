import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QueryState } from '@/components/ui/query-state';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { showsExperimentalLabel } from '@/components/risk/risk';
import { toTimePts, type TimePt } from '@/components/charts/chartMath';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useSensorsLatest } from '@/features/sensors/hooks/useSensorsLatest';
import { EventCharts } from '@/features/events/components/EventCharts';
import { EventStrip } from '@/features/events/components/EventStrips';
import { buildCells } from '@/features/events/utils/strips';
import { buildStory, type StoryItem } from '@/features/events/utils/story';
import { averageRain } from '@/features/reports/utils/eventReport';
import { PageFrame, Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { formatHoraCheia, formatHoraCurta, num } from '@/features/operacao/utils/format';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import { pickRiver } from '@/features/events/utils/river';
import { cn } from '@/lib/utils';

const WINDOWS = [24, 48, 72] as const;
const HOUR = 3_600_000;
const DOT: Record<StoryItem['tone'], string> = { low: 'bg-risk-low', moderate: 'bg-risk-moderate', high: 'bg-risk-high', unknown: 'bg-risk-unknown', info: 'bg-chart-3' };
const TONE_LABEL: Record<StoryItem['tone'], string> = { low: 'risco baixo', moderate: 'atenção', high: 'risco alto', unknown: 'sem previsão', info: 'informação' };

const Legend: React.FC<{ experimental: boolean }> = ({ experimental }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
    {[['bg-risk-low', 'Baixo'], ['bg-risk-moderate', 'Moderado'], ['bg-risk-high', 'Alto'], ['bg-risk-unknown', 'Indisponível']].map(([c, l]) => (
      <span key={l} className="flex items-center gap-1.5"><span className={cn('size-3 rounded-[2px]', c)} />{l}</span>
    ))}
    <span>· colunas apagadas: ainda não aconteceram</span>
    {experimental && <ExperimentalBadge />}
  </div>
);

const TimelineView: React.FC<{ t: Timeline; t0: number; t1: number; hours: number; onHours: (h: (typeof WINDOWS)[number]) => void }> = ({ t, t0, t1, hours, onHours }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const sel = Math.min(t1, Math.max(t0, picked ?? t1));
  const points = useFloodPoints();
  // Todos os tipos: estação ANA ou APAC que mede chuva e rio sai como PRECIPITATION, mas tem nome e cotas do rio.
  const rivers = useSensorsLatest();
  const names = useMemo(() => new Map((points.data ?? []).map((p) => [p.slug, p.name])), [points.data]);
  const riverSeries = useMemo(() => pickRiver(t.river, rivers.data), [t.river, rivers.data]);
  const riverId = riverSeries?.stationId;
  const sensor = rivers.data?.find((s) => s.sensorId === riverId);
  const lvl = (k: string) => { const v = (sensor as Record<string, unknown> | undefined)?.[k]; return typeof v === 'number' ? v : null; };
  const flood = lvl('riverFloodLevel'), alert = lvl('riverAlertLevel');
  const riverName = sensor?.stationName ?? riverId ?? 'Rio';

  const rain = useMemo(() => averageRain(t), [t]);
  const tide = useMemo(() => toTimePts(t.tide.points), [t.tide.points]);
  const river = useMemo(() => toTimePts(riverSeries?.points ?? []), [riverSeries]);
  const cells = useMemo(() => t.risk.map((r) => ({ slug: r.slug, cells: buildCells(r.items, t0, t1) })), [t.risk, t0, t1]);
  const story = useMemo(() => buildStory(t, names, { flood, alert, name: riverName, points: river }), [t, names, flood, alert, riverName, river]);
  const experimental = t.risk.some((r) => r.items.some((p) => showsExperimentalLabel(p)));

  const upTo = (xs: TimePt[]) => xs.filter((p) => p.t <= sel && p.v != null);
  const peak = upTo(rain).reduce<TimePt | null>((m, p) => (m == null || (p.v as number) > (m.v as number) ? p : m), null);
  const maxOf = (xs: TimePt[]) => { const v = upTo(xs).map((p) => p.v as number); return v.length ? Math.max(...v) : null; };
  const maxTide = maxOf(tide), maxRiver = maxOf(river);
  const events = (t.floodEvents ?? []).filter((e) => Date.parse(e.startTime) <= sel).length;
  const kpis = [
    { label: `pico de chuva (média) · ${peak ? formatHoraCurta(new Date(peak.t).toISOString()) : '—'}`, value: peak ? `${num(peak.v)} mm/h` : '—', tone: '' },
    { label: 'maré máxima', value: maxTide != null ? `${num(maxTide, 2)} m` : '—', tone: maxTide != null && maxTide >= 2 ? 'text-warning' : '' },
    { label: `${riverName} máximo`, value: maxRiver != null ? `${num(maxRiver, 0)} cm` : '—', tone: maxRiver != null && flood != null && maxRiver >= flood ? 'text-risk-high-text' : '' },
    { label: 'alagamentos confirmados', value: String(events), tone: '' },
  ];
  const shown = story.filter((s) => s.t <= sel).slice(0, 14);
  const stepMs = (t1 - t0) / 72;
  const ticks = Array.from({ length: 7 }, (_, i) => formatHoraCheia(t0 + ((t1 - t0) * i) / 6));

  return (
    <>
      <Panel aria-label="Linha do tempo" className="gap-2.5 px-5 py-[18px] lg:col-start-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className="m-0 flex-1 text-[24px] font-extrabold leading-[30px]">Linha do tempo do evento</h1>
          <span className="text-[13px] text-muted-foreground">clique em qualquer coluna para ir àquele momento</span>
        </div>
        <div role="group" aria-label="Janela de tempo" className="flex flex-wrap gap-1.5">
          {WINDOWS.map((w) => <WindowButton key={w} w={w} on={hours === w} onPick={onHours} />)}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[120px_1fr] items-center gap-x-3 gap-y-1.5 overflow-y-auto">
          <EventCharts t0={t0} t1={t1} sel={sel} rain={rain} tide={tide} river={river} harbor={t.tide.harbor} riverName={riverName} riverFlood={flood} riverAlert={alert} />
          <div className="col-span-full my-1 h-px bg-border" />
          {cells.map((c) => <EventStrip key={c.slug} name={names.get(c.slug) ?? c.slug} cells={c.cells} sel={sel} onPick={setPicked} />)}
          {t.risk.length === 0 && <p className="col-span-full m-0 text-[13px] text-muted-foreground">Nenhuma previsão nesta janela.</p>}
          <div />
          <div aria-hidden="true" className="flex justify-between font-mono text-[11px] leading-4 text-muted-foreground">{ticks.map((x, i) => <span key={i}>{x}</span>)}</div>
        </div>
        <label className="sr-only">
          Momento do evento
          <input
            type="range" min={t0} max={t1} step={stepMs} value={sel} onChange={(e) => setPicked(Number(e.target.value))}
            aria-valuetext={`até ${formatHoraCurta(new Date(sel).toISOString(), t1) ?? ''}`}
          />
        </label>
        <Legend experimental={experimental} />
      </Panel>
      <aside aria-label="Resumo do evento" className="flex min-w-0 flex-1 flex-col gap-3.5 rounded-2xl border border-border bg-card p-[18px]">
        <PanelTitle>Até {formatHoraCurta(new Date(sel).toISOString(), t1)?.replace(/^\d\d\/\d\d /, '') ?? 'agora'}{picked == null ? ' (agora)' : ''}</PanelTitle>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl bg-muted p-2.5">
              <div className={cn('font-mono text-[18px] font-bold leading-6', k.tone)}>{k.value}</div>
              <div className="text-[11px] leading-[14px] text-muted-foreground">{k.label}</div>
            </div>
          ))}
        </div>
        <PanelTitle className="mt-1">O que aconteceu</PanelTitle>
        <ol className="m-0 flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0">
          {shown.length === 0 && <li className="text-[13px] text-muted-foreground">Nada a registrar até este momento.</li>}
          {shown.map((e, i) => (
            <li key={`${e.t}-${i}`} className="grid grid-cols-[52px_14px_1fr] items-start gap-2 py-1.5">
              <span className="font-mono text-[12px] font-semibold leading-[18px] text-muted-foreground">{formatHoraCurta(new Date(e.t).toISOString(), t1)?.replace('h', 'h')}</span>
              <span aria-hidden="true" className={cn('mt-1 size-2.5 rounded-full', DOT[e.tone])} />
              <span className="text-[13px] leading-[18px]"><span className="sr-only">{TONE_LABEL[e.tone]}: </span>{e.title}</span>
            </li>
          ))}
        </ol>
        <Link to="/relatorio" className="flex h-10 items-center justify-center rounded-lg bg-primary text-[14px] font-bold leading-5 text-primary-foreground no-underline hover:text-primary-foreground hover:opacity-90">Gerar relatório do evento</Link>
      </aside>
    </>
  );
};

export const EventsPage: React.FC = () => {
  const [hours, setHours] = useState<(typeof WINDOWS)[number]>(24);
  const query = useTimeline(hours);
  const isEmpty = (t: Timeline) => t.rain.length + t.river.length + t.risk.length === 0 && t.tide.points.length === 0 && (t.floodEvents ?? []).length === 0;
  const t1 = Date.parse(query.range.to);
  const t0 = t1 - hours * HOUR;
  return (
    <PageFrame className="lg:grid lg:grid-cols-[minmax(0,1040fr)_minmax(0,352fr)] lg:grid-rows-1">
      <QueryState query={query} what="a linha do tempo" isEmpty={isEmpty} emptyTitle="Sem dados nesta janela." emptyHint="Tente uma janela maior.">
        {(t) => <TimelineView key={hours} t={t} t0={t0} t1={t1} hours={hours} onHours={setHours} />}
      </QueryState>
    </PageFrame>
  );
};

const WindowButton: React.FC<{ w: (typeof WINDOWS)[number]; on: boolean; onPick: (w: (typeof WINDOWS)[number]) => void }> = ({ w, on, onPick }) => (
  <button type="button" aria-pressed={on} onClick={() => onPick(w)} className={cn('h-11 cursor-pointer rounded-full border px-3 text-[12px] font-bold md:h-[30px]', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent text-foreground')}>Últimas {w} h</button>
);
export default EventsPage;
