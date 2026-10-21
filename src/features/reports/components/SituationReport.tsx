import React from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { RISK_LEGEND_ORDER, RISK_MEANING, degradationText, getRiskVisual, showsExperimentalLabel } from '@/components/risk/risk';
import { RiskIcon } from '@/components/risk/RiskIcon';
import { TimeChart } from '@/components/charts/TimeChart';
import { toTimePts } from '@/components/charts/chartMath';
import { formatRecife } from '@/features/map/utils/datetime';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { RiskSummary } from '@/features/points/schemas/prediction.schema';
import type { SensorFreshness } from '@/features/sensors/schemas/sensor.schema';
import { SENSOR_TYPE_LABEL, formatAge } from '@/features/sensors/utils/age';
import type { Alert } from '@/features/alerts/schemas/alert.schema';
import { ALERT_KIND_LABEL } from '@/features/alerts/utils/ruleKinds';
import type { Timeline } from '@/features/events/schemas/timeline.schema';
import { rainTotal, sortByRisk } from '../utils/situation';

const num = (v: number, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d });

/** Seção com estado próprio: um dado que falha não derruba o relatório inteiro. */
function Part<T>({ title, query, what, empty, children }: { title: string; query: Pick<UseQueryResult<T>, 'data' | 'isPending' | 'isError'>; what: string; empty?: (d: T) => boolean; children: (d: T) => React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="text-title text-foreground">{title}</h2>
      {query.isPending ? (
        <p role="status" className="text-body text-muted-foreground">Carregando {what}…</p>
      ) : query.isError || query.data === undefined ? (
        <p role="alert" className="text-body text-destructive">Não foi possível carregar {what}. Esta parte do relatório está incompleta.</p>
      ) : empty?.(query.data) ? (
        <p className="text-body text-muted-foreground">Nada a informar em {what}.</p>
      ) : (
        children(query.data)
      )}
    </section>
  );
}

interface Props {
  generatedAt: string;
  author?: string;
  windowHours: number;
  summary: UseQueryResult<RiskSummary>;
  points: UseQueryResult<FloodPointResponseDTO[]>;
  sensors: UseQueryResult<SensorFreshness[]>;
  timeline: UseQueryResult<Timeline> & { range: { from: string; to: string } };
  /** Alertas abertos; ausente quando o perfil não os acessa (ADR 0010). */
  alerts?: UseQueryResult<{ content: Alert[]; totalElements: number }>;
}

export const SituationReport: React.FC<Props> = ({ generatedAt, author, windowHours, summary, points, sensors, timeline, alerts }) => (
  <article aria-label="Relatório de situação" className="print-sheet flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-foreground">
    <header className="flex flex-col gap-1 border-b border-border pb-3">
      <h2 className="text-title-lg">Relatório de situação</h2>
      <p className="text-body text-muted-foreground">MAPi · gerado em {formatRecife(generatedAt) ?? '—'} (America/Recife){author ? ` · por ${author}` : ''} · janela das últimas {windowHours} h</p>
      <ExperimentalBadge className="mt-1 w-fit" />
      <p className="text-caption text-muted-foreground">Toda classe de risco deste relatório é experimental enquanto o modelo for NOT_VALIDATED. A classe não confirma alagamento no local.</p>
    </header>

    <Part title="Resumo de risco" query={summary} what="a contagem por risco">
      {(s) => (
        <>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RISK_LEGEND_ORDER.map((level) => {
              const v = getRiskVisual(level);
              return (
                <li key={level} data-risk-count={level} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${v.border} ${v.softBg}`}>
                  <RiskIcon level={level} className={`size-5 ${v.text}`} />
                  <span className="text-body-strong">{v.label}</span>
                  <span className="ml-auto text-reading-lg">{s[level]}</span>
                </li>
              );
            })}
          </ul>
          <p className="text-caption text-muted-foreground">Contagem de pontos ativos pela última previsão de cada um, calculada em {formatRecife(s.computedAt) ?? '—'}. “Previsão indisponível” não é risco baixo.</p>
        </>
      )}
    </Part>

    <Part title="Pontos críticos" query={points} what="os pontos" empty={(d) => d.length === 0}>
      {(list) => (
        <table className="w-full text-left text-body">
          <caption className="sr-only">Pontos críticos por nível de risco</caption>
          <thead>
            <tr className="border-b border-border text-caption text-muted-foreground">
              <th scope="col" className="py-1 pr-3 font-medium">Ponto</th>
              <th scope="col" className="py-1 pr-3 font-medium">Risco</th>
              <th scope="col" className="py-1 font-medium">Previsão</th>
            </tr>
          </thead>
          <tbody>
            {sortByRisk(list.filter((p) => p.active)).map((p) => {
              const pred = p.floodPrediction;
              return (
                <tr key={p.slug} data-slug={p.slug} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3"><span className="block text-body-strong">{p.name}</span><span className="text-caption text-muted-foreground">{p.municipality ?? ''}</span></td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-col items-start gap-1">
                      <RiskBadge level={pred?.riskLevel} probability={pred?.floodProbability} />
                      {showsExperimentalLabel(pred) && <ExperimentalBadge />}
                    </div>
                  </td>
                  <td className="py-2 text-caption text-muted-foreground">
                    {pred?.riskLevel === 'UNKNOWN' || !pred
                      ? `${degradationText(pred?.degradationReason)}${pred?.lastValidIssuedAt ? `; última previsão válida em ${formatRecife(pred.lastValidIssuedAt)}` : '; sem previsão válida registrada'}`
                      : `Emitida em ${formatRecife(pred.issuedAt) ?? '—'}${pred.validUntil ? `, válida até ${formatRecife(pred.validUntil)}` : ''}. ${RISK_MEANING[pred.riskLevel]}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Part>

    <Part title={`Chuva nas últimas ${windowHours} h`} query={timeline} what="a chuva" empty={(t) => t.rain.length === 0}>
      {(t) => (
        <>
          <table className="w-full text-left text-body">
            <caption className="sr-only">Chuva por pluviômetro</caption>
            <thead><tr className="border-b border-border text-caption text-muted-foreground"><th scope="col" className="py-1 pr-3 font-medium">Pluviômetro</th><th scope="col" className="py-1 pr-3 text-right font-medium">Total (mm)</th><th scope="col" className="py-1 text-right font-medium">Maior hora (mm)</th></tr></thead>
            <tbody>
              {t.rain.map((s) => {
                const r = rainTotal(s.points);
                return (
                  <tr key={s.stationId} className="border-b border-border/60">
                    <td className="py-1.5 pr-3 text-code">{s.stationId}</td>
                    <td className="py-1.5 pr-3 text-right text-reading">{num(r.totalMm, 2)}{r.missingHours > 0 ? ` (${r.missingHours} h sem leitura)` : ''}</td>
                    <td className="py-1.5 text-right text-reading">{num(r.maxHourMm, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-caption text-muted-foreground">Total = soma das barras horárias da janela (cada hora termina no horário indicado).</p>
          {t.rain[0] && (
            <TimeChart title={`Chuva por hora, ${t.rain[0].stationId}`} unit="mm na hora" from={Date.parse(timeline.range.from)} to={Date.parse(timeline.range.to)} zero height={150}
              series={[{ id: t.rain[0].stationId, label: t.rain[0].stationId, kind: 'bars', points: toTimePts(t.rain[0].points), colorClass: 'text-chart-3' }]} />
          )}
        </>
      )}
    </Part>

    <Part title="Sensores" query={sensors} what="os sensores" empty={(d) => d.length === 0}>
      {(list) => {
        const stale = list.filter((s) => s.stale);
        return (
          <>
            <p className="text-body">{list.length} sensor{list.length === 1 ? '' : 'es'}; {stale.length === 0 ? 'todos respondendo.' : `${stale.length} sem resposta recente.`}</p>
            {stale.length > 0 && (
              <ul className="list-disc pl-5 text-body">
                {stale.map((s) => <li key={s.sensorId}>{s.stationName || s.sensorId} ({SENSOR_TYPE_LABEL[s.type]}): última leitura {formatAge(s.ageSeconds)}</li>)}
              </ul>
            )}
          </>
        );
      }}
    </Part>

    {alerts ? (
      <Part title="Alertas abertos" query={alerts} what="os alertas" empty={(d) => d.content.length === 0}>
        {(d) => (
          <ul className="flex flex-col gap-1 text-body">
            {d.content.map((a) => (
              <li key={a.id}>
                <span className="text-body-strong">{a.title}</span>{' '}
                <span className="text-caption text-muted-foreground">({ALERT_KIND_LABEL(a.kind)}, {formatRecife(a.triggeredAt) ?? '—'})</span>
              </li>
            ))}
            {d.totalElements > d.content.length && <li className="text-caption text-muted-foreground">e mais {d.totalElements - d.content.length} alerta(s) na tela Alertas.</li>}
          </ul>
        )}
      </Part>
    ) : (
      <section aria-label="Alertas abertos" className="flex flex-col gap-1">
        <h2 className="text-title text-foreground">Alertas abertos</h2>
        <p className="text-body text-muted-foreground">Seu perfil não lista alertas; esta parte não consta neste relatório.</p>
      </section>
    )}
  </article>
);
