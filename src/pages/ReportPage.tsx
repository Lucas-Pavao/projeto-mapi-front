import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { hasRole, parseRole } from '@/lib/roles';
import { toTimePts } from '@/components/charts/chartMath';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useSensorsLatest } from '@/features/sensors/hooks/useSensorsLatest';
import { pickRiver } from '@/features/events/utils/river';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { useReports } from '@/features/reports/hooks/useReports';
import { useTimeline } from '@/features/events/hooks/useTimeline';
import { EventReport, type SectionKey } from '@/features/reports/components/EventReport';
import { averageRain, pointRows, summaryText, toCsv } from '@/features/reports/utils/eventReport';
import { PageFrame } from '@/features/operacao/components/Panel';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { cn } from '@/lib/utils';

const LABELS: Record<SectionKey, string> = {
  resumo: 'Resumo e números',
  graficos: 'Gráficos de chuva, maré e rio',
  pontos: 'Tabela de pontos críticos',
  alertas: 'Alertas disparados',
  relatos: 'Relatos confirmados',
};

/**
 * Relatório do evento: opções à esquerda e a folha (sempre no tema claro, A4) à direita. "Gerar PDF" usa a
 * impressão do navegador; o CSS de impressão (styles/print.css) tira a navegação e deixa a folha fluir.
 */
export const ReportPage: React.FC = () => {
  const { user } = useAuth();
  const canSee = hasRole(parseRole(user?.role), 'OPERADOR');
  const [hours, setHours] = useState(24);
  const [draft, setDraft] = useState<number | null>(null);
  const [show, setShow] = useState<Record<SectionKey, boolean>>({ resumo: true, graficos: true, pontos: true, alertas: true, relatos: false });
  const timeline = useTimeline(hours);
  const points = useFloodPoints();
  const sensors = useSensorsLatest();
  const alerts = useAlerts('ALL', { size: 100, enabled: canSee });
  const reports = useReports('CONFIRMED', 0, 50, canSee);

  const t1 = Date.parse(timeline.range.to);
  const t0 = t1 - hours * 3_600_000;
  const t = timeline.data;
  const names = useMemo(() => new Map((points.data ?? []).map((p) => [p.slug, p.name])), [points.data]);
  const rain = useMemo(() => (t ? averageRain(t) : []), [t]);
  const tide = useMemo(() => toTimePts(t?.tide.points ?? []), [t]);
  const riverSeries = useMemo(() => pickRiver(t?.river, sensors.data), [t, sensors.data]);
  const river = useMemo(() => toTimePts(riverSeries?.points ?? []), [riverSeries]);
  const rows = useMemo(() => (t ? pointRows(t, names, t0, t1) : []), [t, names, t0, t1]);
  const riverSensor = sensors.data?.find((s) => s.sensorId === riverSeries?.stationId);
  const riverName = riverSensor?.stationName ?? riverSeries?.stationId ?? null;

  const inWindow = (iso: string | null | undefined) => { const ms = iso ? Date.parse(iso) : NaN; return ms >= t0 && ms <= t1; };
  const alertsIn = canSee ? (alerts.data?.content ?? []).filter((a) => inWindow(a.triggeredAt)) : undefined;
  const reportsIn = canSee ? (reports.data?.content ?? []).filter((r) => inWindow(r.reviewedAt ?? r.observedAt)) : undefined;

  const peak = rain.reduce<(typeof rain)[number] | null>((m, p) => (m == null || (p.v ?? 0) > (m.v ?? 0) ? p : m), null);
  const reached = rows.filter((r) => r.maxLevel === 'HIGH').length;
  const riverMax = river.filter((p) => p.v != null).reduce<number | null>((m, p) => (m == null || (p.v as number) > m ? (p.v as number) : m), null);
  const kpis = [
    { label: `pico de chuva (média)${peak ? ` · ${formatHoraCurta(new Date(peak.t).toISOString(), t1)}` : ''}`, value: peak ? `${num(peak.v)} mm/h` : '—' },
    { label: 'pontos que chegaram a alto', value: `${reached} de ${rows.length}`, tone: reached > 0 ? 'text-risk-high-text' : undefined },
    { label: 'alertas na janela', value: alertsIn ? String(alertsIn.length) : 'sem acesso' },
    // A série do rio na linha do tempo vem do sensor_data, em cm (como na tela Eventos).
    { label: `${riverName ?? 'rio'} (máximo)`, value: riverMax != null ? `${num(riverMax, 0)} cm` : '—' },
  ];
  const stale = (sensors.data ?? []).filter((s) => s.stale).length;
  const sensorsLine = sensors.data ? `Sensores: ${sensors.data.length} monitorados, ${stale === 0 ? 'todos respondendo' : `${stale} sem resposta recente`}.` : null;
  const summary = t ? summaryText(rows, rain, tide, t1) : 'Carregando…';
  const sections = (Object.keys(LABELS) as SectionKey[]);
  const nSections = sections.filter((k) => show[k]).length;
  const shown = draft ?? hours;
  const commit = () => { if (draft != null) setHours(draft); setDraft(null); };

  const csv = () => {
    const text = toCsv(['ponto', 'prob_max_pct', 'quando', 'minutos_em_alto'], rows.map((r) => [r.name, r.maxProb != null ? Math.round(r.maxProb * 100) : null, r.maxAt != null ? new Date(r.maxAt).toISOString() : null, r.highMin]));
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapi-relatorio-${hours}h.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageFrame className="print:static print:block print:p-0 lg:flex-row">
      <aside aria-label="Opções do relatório" className="no-print flex w-full shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-[18px] lg:w-[380px]">
        <div>
          <h1 className="m-0 text-[22px] font-extrabold leading-7">Relatório do evento</h1>
          <p className="m-0 mt-1 text-[13px] text-muted-foreground">Monta um resumo para a coordenação a partir do que o MAPi registrou.</p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="flex justify-between text-[13px] font-bold">Janela do relatório<span className="font-mono">últimas {shown} h</span></span>
          <input type="range" min={6} max={72} step={1} value={shown} onChange={(e) => setDraft(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} className="m-0 w-full accent-primary" />
          <span className="text-[11px] text-muted-foreground">Período: {formatHoraCurta(new Date(t0).toISOString(), t1)} até {formatHoraCurta(new Date(t1).toISOString(), t1)} · o relatório se refaz ao soltar</span>
        </label>
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-[13px] font-bold">Seções</legend>
          {sections.map((k) => {
            const blocked = (k === 'alertas' || k === 'relatos') && !canSee;
            return (
              <label key={k} className={cn('flex items-center gap-2.5 text-[14px]', blocked ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer')}>
                <input type="checkbox" className="m-0 size-4 accent-primary" checked={show[k]} disabled={blocked} onChange={() => setShow((s) => ({ ...s, [k]: !s[k] }))} />
                {LABELS[k]}{blocked && <span className="text-[11px]">(seu perfil não acessa)</span>}
              </label>
            );
          })}
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold">Enviar para</span>
          <p className="m-0 text-[12px] text-muted-foreground">O envio direto para a coordenação ainda não existe: gere o PDF e envie pelo canal de costume.</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex h-7 items-center rounded-full border border-dashed border-input px-2.5 text-[12px] text-muted-foreground">+ adicionar · em breve</span>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <span role="status" className="text-[12px] text-muted-foreground">Pronto para gerar · {nSections} seç{nSections === 1 ? 'ão' : 'ões'}</span>
          <div className="flex gap-2">
            <Button type="button" size="lg" className="h-11 flex-1 md:h-9" onClick={() => window.print()}>Gerar PDF</Button>
            <Button type="button" variant="outline" size="lg" className="h-11 text-foreground md:h-9" disabled={rows.length === 0} onClick={csv}>CSV dos dados</Button>
          </div>
          <Link to="/eventos" className="text-[12px] text-primary hover:underline">Voltar à linha do tempo do evento</Link>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-auto rounded-2xl bg-muted p-3 lg:pt-5 print:block print:overflow-visible print:bg-transparent print:p-0">
        <EventReport
          show={show} generatedAt={timeline.now} from={t0} to={t1} hours={hours} author={user?.username} kpis={kpis} summary={summary} sensorsLine={sensorsLine}
          rain={rain} tide={tide} river={river} riverName={riverName} rows={rows} points={points.data ?? []} alerts={alertsIn} reports={reportsIn}
          failed={{ timeline: timeline.isError, points: points.isError, alerts: alerts.isError, reports: reports.isError }}
        />
      </div>
    </PageFrame>
  );
};
export default ReportPage;
