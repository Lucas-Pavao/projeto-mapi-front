import React from 'react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { getRiskVisual } from '@/components/risk/risk';
import type { TimePt } from '@/components/charts/chartMath';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import type { Alert } from '@/features/alerts/schemas/alert.schema';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { FloodReport } from '../schemas/report.schema';
import { WATER_DEPTH_LABEL } from '../utils/labels';
import type { PointRow } from '../utils/eventReport';
import logo from '@/assets/mapi-logo-on-light.svg';
import { cn } from '@/lib/utils';

export type SectionKey = 'resumo' | 'graficos' | 'pontos' | 'alertas' | 'relatos';

interface Kpi { label: string; value: string; tone?: string }
interface Props {
  show: Record<SectionKey, boolean>;
  generatedAt: number;
  from: number;
  to: number;
  hours: number;
  author?: string;
  kpis: Kpi[];
  summary: string;
  sensorsLine: string | null;
  rain: TimePt[];
  tide: TimePt[];
  river: TimePt[];
  riverName: string | null;
  rows: PointRow[];
  points: FloodPointResponseDTO[];
  /** undefined = o perfil não acessa; [] = nada na janela. */
  alerts: Alert[] | undefined;
  reports: FloodReport[] | undefined;
  /** Erro de carga por parte: o relatório indica que está incompleto. */
  failed: { timeline: boolean; points: boolean; alerts: boolean; reports: boolean };
}

const H = (t: number, now: number) => formatHoraCurta(new Date(t).toISOString(), now) ?? '—';
const W = 560, HT = 120;
const sx = (t: number, a: number, b: number) => ((t - a) / (b - a)) * W;
const sy = (v: number, max: number) => HT - (Math.min(max, v) / max) * HT;

const Warn: React.FC<{ what: string }> = ({ what }) => <p role="alert" className="m-0 text-[11px] text-destructive">Não foi possível carregar {what}. Esta parte do relatório está incompleta.</p>;

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="mb-1 text-[10px] font-extrabold tracking-[0.06em] text-muted-foreground">{children}</div>;

/** Folha do relatório (sempre no tema claro). Cada parte só mostra o que a API entregou; o que faltou é dito. */
export const EventReport: React.FC<Props> = ({ show, generatedAt, from, to, hours, author, kpis, summary, sensorsLine, rain, tide, river, riverName, rows, points, alerts, reports, failed }) => {
  const rainMax = Math.max(10, ...rain.map((p) => p.v ?? 0));
  const lvMax = Math.max(3.4, ...tide.map((p) => p.v ?? 0), ...river.map((p) => p.v ?? 0));
  const line = (pts: TimePt[], max: number) => pts.filter((p) => p.v != null && p.t >= from && p.t <= to).map((p) => `${sx(p.t, from, to).toFixed(1)},${sy(p.v as number, max).toFixed(1)}`).join(' ');
  const area = (() => {
    const v = rain.filter((p) => p.v != null && p.t >= from && p.t <= to);
    return v.length ? `${sx(v[0].t, from, to).toFixed(1)},${HT} ${v.map((p) => `${sx(p.t, from, to).toFixed(1)},${sy(p.v as number, rainMax).toFixed(1)}`).join(' ')} ${sx(v[v.length - 1].t, from, to).toFixed(1)},${HT}` : '';
  })();
  const byslug = new Map(points.map((p) => [p.slug, p]));
  return (
    <article
      data-theme="light" data-accent="capibaribe" aria-label="Relatório de situação"
      className="print-sheet box-border flex min-h-[790px] w-full max-w-[600px] flex-col gap-4 bg-white px-9 py-8 font-sans text-foreground shadow-[0_8px_30px_rgba(0,0,0,.35)] print:min-h-0 print:max-w-none print:px-0 print:py-0 print:shadow-none"
    >
      <div className="flex items-center justify-between border-b-2 border-foreground pb-3">
        <img src={logo} alt="MAPi" className="h-[26px]" />
        <span className="font-mono text-[11px] text-muted-foreground">gerado às {H(generatedAt, generatedAt)} · uso interno</span>
      </div>
      <div>
        <h2 className="m-0 text-[22px] font-extrabold leading-7">Relatório de situação</h2>
        <p className="m-0 mt-0.5 text-[12px] text-muted-foreground">Região Metropolitana do Recife · {H(from, generatedAt)}–{H(to, generatedAt)} (últimas {hours} h, America/Recife){author ? ` · por ${author}` : ''}</p>
        <ExperimentalBadge className="mt-1.5 w-fit" />
        <p className="m-0 mt-1 text-[10px] leading-[13px] text-muted-foreground">Toda classe de risco deste relatório é experimental enquanto o modelo for NOT_VALIDATED. A classe não confirma alagamento no local.</p>
      </div>

      {show.resumo && (
        <section aria-label="Resumo" className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-lg border border-border px-2.5 py-2">
                <div className={cn('font-mono text-[16px] font-extrabold leading-5', k.tone)}>{k.value}</div>
                <div className="text-[10px] leading-[13px] text-muted-foreground">{k.label}</div>
              </div>
            ))}
          </div>
          {failed.timeline ? <Warn what="a linha do tempo" /> : <p className="m-0 text-[12px] leading-[17px]">{summary}</p>}
          {sensorsLine && <p className="m-0 text-[11px] text-muted-foreground">{sensorsLine}</p>}
        </section>
      )}

      {show.graficos && (
        <section aria-label="Gráficos">
          <Title>CHUVA MÉDIA, MARÉ E RIO</Title>
          {failed.timeline ? <Warn what="a linha do tempo" /> : (
            <>
              <svg viewBox={`0 0 ${W} ${HT}`} preserveAspectRatio="none" role="img" aria-label="Chuva, maré e rio no período" className="block h-[120px] w-full border-b border-border">
                <polygon points={area} fill="var(--chart-3)" opacity="0.45" />
                <polyline points={line(tide, lvMax)} fill="none" stroke="var(--chart-2)" strokeWidth="2" />
                <polyline points={line(river, lvMax)} fill="none" stroke="var(--chart-1)" strokeWidth="2" />
              </svg>
              <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <span>área: chuva (mm/h)</span><span style={{ color: 'var(--chart-2)' }}>— maré (m)</span>
                {riverName && <span style={{ color: 'var(--chart-1)' }}>— {riverName} (m)</span>}
              </div>
            </>
          )}
        </section>
      )}

      {show.pontos && (
        <section aria-label="Pontos críticos">
          {failed.timeline || failed.points ? <Warn what="os pontos" /> : rows.length === 0 ? <p className="m-0 text-[11px] text-muted-foreground">Nenhuma previsão na janela.</p> : (
            <table className="w-full border-collapse text-left text-[11px]">
              <caption className="sr-only">Pontos críticos pela maior probabilidade na janela</caption>
              <thead>
                <tr className="text-muted-foreground">
                  {['Ponto', 'Prob. máx.', 'Quando', 'Tempo em alto', 'Risco agora'].map((h) => <th key={h} scope="col" className="border-b border-border py-1 pr-2 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pred = byslug.get(r.slug)?.floodPrediction;
                  return (
                    <tr key={r.slug} data-slug={r.slug}>
                      <td className="border-b border-border py-[5px] pr-2 font-bold">{r.name}</td>
                      <td className={cn('border-b border-border pr-2 font-mono font-bold', r.maxLevel ? getRiskVisual(r.maxLevel).text : 'text-muted-foreground')}>{r.maxProb != null ? `${Math.round(r.maxProb * 100)}%` : '—'}</td>
                      <td className="border-b border-border pr-2 font-mono">{r.maxAt != null ? H(r.maxAt, generatedAt) : '—'}</td>
                      <td className="border-b border-border pr-2 font-mono">{r.highMin ? `${r.highMin} min` : '—'}</td>
                      <td className="border-b border-border py-[3px]">
                        <RiskBadge level={pred?.riskLevel} probability={pred?.floodProbability} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {show.alertas && (
        <section aria-label="Principais alertas">
          <Title>PRINCIPAIS ALERTAS</Title>
          {failed.alerts ? <Warn what="os alertas" /> : alerts === undefined ? <p className="m-0 text-[11px] text-muted-foreground">Seu perfil não lista alertas; esta parte não consta neste relatório.</p> : alerts.length === 0 ? <p className="m-0 text-[11px] text-muted-foreground">Nenhum alerta disparado na janela.</p> : alerts.slice(0, 7).map((a) => (
            <div key={a.id} className="flex gap-2.5 text-[11px] leading-4"><span className="font-mono text-muted-foreground">{H(Date.parse(a.triggeredAt), generatedAt)}</span><span>{a.title}</span></div>
          ))}
        </section>
      )}

      {show.relatos && (
        <section aria-label="Relatos confirmados">
          <Title>RELATOS CONFIRMADOS</Title>
          {failed.reports ? <Warn what="os relatos" /> : reports === undefined ? <p className="m-0 text-[11px] text-muted-foreground">Seu perfil não lista relatos; esta parte não consta neste relatório.</p> : reports.length === 0 ? <p className="m-0 text-[11px] text-muted-foreground">Nenhum relato confirmado na janela.</p> : reports.slice(0, 7).map((r) => (
            <div key={r.id} className="flex gap-2.5 text-[11px] leading-4">
              <span className="font-mono text-muted-foreground">{H(Date.parse(r.observedAt), generatedAt)}</span>
              <span>{byslug.get(r.nearestPointSlug ?? '')?.name ?? r.nearestPointSlug ?? 'Sem ponto por perto'} · {r.waterDepth ? WATER_DEPTH_LABEL[r.waterDepth] : 'altura não informada'}{r.floodEventId != null ? ` · evento #${r.floodEventId}` : ''}</span>
            </div>
          ))}
        </section>
      )}

      <p className="m-0 mt-auto border-t border-border pt-2 text-[9px] leading-[13px] text-muted-foreground">
        Previsão experimental, modelo não validado (ADR 0007). Probabilidades não confirmam alagamento no local. “Previsão indisponível” não é risco baixo. Fontes: APAC, Cemaden, ANA, Open-Meteo, DHN/TabuaMare, CKAN Recife.
      </p>
    </article>
  );
};
