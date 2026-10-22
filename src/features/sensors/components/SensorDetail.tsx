import React, { useMemo } from 'react';
import { CloudRain, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { HOUR_MS, yDomain, type TimePt } from '@/components/charts/chartMath';
import { cn } from '@/lib/utils';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import type { SensorFreshness } from '../schemas/sensor.schema';
import { SENSOR_TYPE_UNIT, formatAge } from '../utils/age';
import { TIDE_HIGH_M, rainAccum, seriesKeys, seriesOf, tideRising, tideSide, toCsv, valueAt, type SideRow } from '../utils/sensorView';
import { SeriesChart, type RefLine } from './SeriesChart';

interface Props {
  sel: { kind: 'chuva' | 'rio'; sensor: SensorFreshness } | { kind: 'mare'; sensor?: undefined };
  timeline: Timeline | undefined;
  now: number;
  t0: number;
  t1: number;
}

const levelOf = (s: SensorFreshness, k: 'riverPreAlertLevel' | 'riverAlertLevel' | 'riverFloodLevel'): number | null => {
  const v = (s as Record<string, unknown>)[k];
  return typeof v === 'number' ? v : null;
};

interface View {
  title: string; subtitle: string; Icon: typeof Waves; color: string; value: string; valueTone: string; fresh: string; freshWarn: boolean;
  badge: { text: string; tone: 'warning' | 'high' } | null;
  chartTitle: string; chartNote: string; mode: 'line' | 'bars'; points: TimePt[]; ghost?: TimePt[];
  lines: RefLine[]; yMin: number; yMax: number; amberFrom?: number;
  sideTitle: string; side: SideRow[]; sideNote: string; source: string; id: string;
}

function build(p: Props): View {
  const { sel, timeline, now } = p;
  if (sel.kind === 'mare') {
    const pts = seriesOf(timeline, 'mare', 'mare');
    const cur = valueAt(pts, now);
    const up = tideRising(pts, now);
    const high = cur != null && cur > TIDE_HIGH_M;
    const max = Math.max(2.6, ...pts.map((q) => q.v ?? 0));
    return {
      title: `Maré · porto ${timeline?.tide.harbor ?? ''}`, subtitle: `Maré prevista · porto ${timeline?.tide.harbor ?? ''} · tábua da DHN`, Icon: Waves, color: 'var(--sand)',
      value: cur == null ? '—' : `${num(cur, 2)} m`, valueTone: high ? 'text-warning' : 'text-foreground', fresh: `${up == null ? '' : up ? 'enchendo · ' : 'vazando · '}tábua do dia`, freshWarn: false,
      badge: high ? { text: 'Maré alta (acima de 2,0 m)', tone: 'warning' } : null,
      chartTitle: 'Maré prevista hoje (m, nível de redução)', chartNote: 'maré alta quando passa de 2,0 m', mode: 'line', points: pts, ghost: pts,
      lines: [{ value: TIDE_HIGH_M, color: 'var(--warning)', text: 'var(--warning)', label: '2,00' }], yMin: 0, yMax: Math.ceil(max * 2) / 2,
      sideTitle: 'Hoje', side: tideSide(pts, now), sideNote: 'Altura sobre o nível de redução da Marinha. Não comparar com a cota do terreno (ADR 0009).', source: 'tábua de maré (DHN)', id: timeline?.tide.harbor ?? '',
    };
  }
  const s = sel.sensor;
  const unit = s.unit || SENSOR_TYPE_UNIT[s.type];
  const fresh = s.stale ? `última leitura ${formatHoraCurta(s.observedAt) ?? '—'}` : `leitura às ${formatHoraCurta(s.observedAt) ?? '—'} · ${formatAge(s.ageSeconds)}`;
  const place = [s.sensorId, s.municipality, s.source].filter(Boolean).join(' · ');
  const value = s.stale || s.value == null ? '—' : `${num(s.value, s.type === 'RIVER_LEVEL' ? 2 : 1)} ${unit}`;
  if (sel.kind === 'rio') {
    const pts = seriesOf(timeline, 'rio', seriesKeys(s));
    const lv = [{ v: levelOf(s, 'riverFloodLevel'), n: 'Inundação' }, { v: levelOf(s, 'riverAlertLevel'), n: 'Alerta' }, { v: levelOf(s, 'riverPreAlertLevel'), n: 'Pré-alerta' }];
    const lines: RefLine[] = [];
    if (lv[0].v != null) lines.push({ value: lv[0].v, color: 'var(--risk-high-edge)', text: 'var(--risk-high-text)', label: num(lv[0].v, 2) });
    if (lv[1].v != null) lines.push({ value: lv[1].v, color: 'var(--risk-moderate)', text: 'var(--risk-moderate-text)', label: num(lv[1].v, 2) });
    if (lv[2].v != null) lines.push({ value: lv[2].v, color: 'var(--muted-foreground)', text: 'var(--muted-foreground)', label: num(lv[2].v, 2) });
    const dom = yDomain([...pts.map((q) => q.v), ...lines.map((l) => l.value)], { ticks: 4 });
    const cur = s.stale ? null : s.value ?? null;
    const peak = Math.max(...pts.filter((q) => q.t <= now).map((q) => q.v ?? -Infinity));
    let badge: View['badge'] = null;
    if (cur != null && lv[0].v != null && cur >= lv[0].v) badge = { text: 'Cota de inundação atingida', tone: 'high' };
    else if (cur != null && lv[1].v != null && cur >= lv[1].v) badge = { text: 'Cota de alerta atingida', tone: 'warning' };
    else if (cur != null && lv[2].v != null && cur >= lv[2].v) badge = { text: 'Cota de pré-alerta atingida', tone: 'warning' };
    else if (cur != null && lv[2].v != null) badge = { text: 'Abaixo do pré-alerta', tone: 'warning' };
    const tone = (v: number | null, hi: number | null, al: number | null) => (v != null && hi != null && v >= hi ? 'high' : v != null && al != null && v >= al ? 'moderate' : undefined) as SideRow['tone'];
    return {
      title: s.stationName || s.sensorId, subtitle: `Nível de rio · ${place}`, Icon: Waves, color: 'var(--primary)',
      value, valueTone: tone(cur, lv[0].v, lv[1].v) === 'high' ? 'text-risk-high-text' : tone(cur, lv[0].v, lv[1].v) === 'moderate' ? 'text-risk-moderate-text' : 'text-foreground', fresh, freshWarn: s.stale,
      badge: s.stale ? { text: 'Sem resposta recente', tone: 'warning' } : badge,
      chartTitle: 'Nível do rio hoje (m)', chartNote: lines.length ? 'cotas oficiais da APAC para a estação' : 'a API não informou as cotas desta estação', mode: 'line', points: pts, ghost: pts, lines, yMin: dom.min, yMax: dom.max,
      sideTitle: 'Cotas da APAC',
      side: [
        { label: 'Inundação', value: lv[0].v != null ? `${num(lv[0].v, 2)} m` : '—', tone: tone(cur, lv[0].v, null) },
        { label: 'Alerta', value: lv[1].v != null ? `${num(lv[1].v, 2)} m` : '—', tone: tone(cur, null, lv[1].v) },
        { label: 'Pré-alerta', value: lv[2].v != null ? `${num(lv[2].v, 2)} m` : '—' },
        { label: 'Máximo do dia', value: Number.isFinite(peak) ? `${num(peak, 2)} m` : '—', tone: 'muted' },
      ],
      sideNote: 'A API guarda riverPreAlertLevel, riverAlertLevel e riverFloodLevel publicados pela APAC; sem eles, a cota fica em "—".', source: s.source ?? '—', id: s.sensorId,
    };
  }
  const pts = seriesOf(timeline, 'chuva', seriesKeys(s));
  const max = Math.max(10, ...pts.map((q) => q.v ?? 0));
  const day = pts.filter((q) => q.t <= now + 1).map((q) => q.v ?? 0);
  const acc = (h: number) => rainAccum(pts, now, h);
  const f = (v: number | null) => (v == null ? '—' : `${num(v)} mm`);
  return {
    title: `Pluviômetro ${s.stationName || s.sensorId}`, subtitle: `Chuva · ${place}`, Icon: CloudRain, color: 'var(--chart-3)',
    value, valueTone: 'text-foreground', fresh, freshWarn: s.stale, badge: s.stale ? { text: 'Sem resposta recente', tone: 'warning' } : null,
    chartTitle: 'Chuva por hora (mm)', chartNote: s.stale ? 'série interrompida: o sensor parou de responder' : 'acumulado de cada hora', mode: 'bars', points: pts, lines: [],
    yMin: 0, yMax: Math.ceil(max * 1.15 / 5) * 5,
    sideTitle: 'Acumulados', side: [
      { label: 'Máxima por hora', value: day.length ? f(Math.max(...day)) : '—' }, { label: '3 h', value: f(acc(3)) }, { label: '6 h', value: f(acc(6)) }, { label: '24 h', value: f(acc(24)), tone: 'muted' },
    ],
    sideNote: 'Os acumulados somam as barras horárias da janela mostrada, vindas da linha do tempo da API.', source: s.source ?? '—', id: s.sensorId,
  };
}

const toneCls = (t: SideRow['tone']) => (t === 'high' ? 'border-risk-high-edge text-risk-high-text' : t === 'moderate' ? 'border-risk-moderate text-risk-moderate-text' : t === 'muted' ? 'border-border bg-muted' : 'border-border');

export const SensorDetail: React.FC<Props> = (props) => {
  const v = useMemo(() => build(props), [props]);
  const { t0, t1, now } = props;
  const exportar = () => {
    const rows = v.points.filter((q) => q.t >= t0 && q.t <= Math.min(t1, now + HOUR_MS)).map((q): [string, number | null] => [new Date(q.t).toISOString(), q.v]);
    const url = URL.createObjectURL(new Blob([toCsv(rows, ['instante_utc', 'valor'])], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapi-${v.id || 'serie'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <section aria-label="Sensor selecionado" className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card px-5 py-[18px] lg:col-span-12">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-secondary" style={{ color: v.color }}><v.Icon className="size-6" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[24px] font-extrabold leading-[30px]">{v.title}</h2>
          <p className="m-0 mt-0.5 text-[14px] leading-5 text-muted-foreground">{v.subtitle}</p>
        </div>
        <div className="text-right">
          <div className={cn('font-mono text-[34px] font-extrabold leading-10', v.valueTone)}>{v.value}</div>
          <div className={cn('text-[12px] leading-4', v.freshWarn ? 'text-warning' : 'text-muted-foreground')}>{v.fresh}</div>
        </div>
        {v.badge && (
          <span role="status" className={cn('inline-flex h-[30px] items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[12px] font-bold', v.badge.tone === 'high' ? 'border-risk-high-edge text-risk-high-text' : 'border-warning text-warning')}>{v.badge.text}</span>
        )}
      </section>
      <Panel aria-label="Série do dia" className="min-h-[320px] gap-2 lg:col-span-8 lg:min-h-0">
        <div className="flex items-baseline justify-between"><PanelTitle>{v.chartTitle}</PanelTitle><span className="text-[12px] text-muted-foreground">{v.chartNote}</span></div>
        <SeriesChart label={v.chartTitle} t0={t0} t1={t1} now={now} yMin={v.yMin} yMax={v.yMax} color={v.color} mode={v.mode} points={v.points} ghost={v.ghost} lines={v.lines} amberFrom={v.amberFrom} />
      </Panel>
      <Panel aria-label="Resumo" className="lg:col-span-4 lg:min-h-0">
        <PanelTitle>{v.sideTitle}</PanelTitle>
        {v.side.map((r) => (
          <div key={r.label} className={cn('flex items-center justify-between rounded-[10px] border px-3 py-2.5', toneCls(r.tone))}>
            <span className={cn('text-[13px] font-semibold leading-[18px]', !r.tone || r.tone === 'muted' ? 'text-foreground' : '')}>{r.label}</span>
            <span className="font-mono text-[15px] font-bold leading-5 text-foreground">{r.value}</span>
          </div>
        ))}
        <p className="m-0 mt-auto text-[12px] leading-4 text-muted-foreground">{v.sideNote}</p>
      </Panel>
      <section aria-label="Proveniência" className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-[18px] py-3 text-[12px] leading-4 text-muted-foreground lg:col-span-12">
        <span>Fonte <strong className="text-foreground">{v.source}</strong></span>
        <span>Gravado em UTC, exibido em America/Recife</span>
        <span>Identificador <span className="font-mono text-foreground">{v.id || '—'}</span></span>
        <span className="ml-auto"><Button type="button" variant="outline" size="sm" className="text-foreground" onClick={exportar}>Exportar 24 h (CSV)</Button></span>
      </section>
    </>
  );
};
