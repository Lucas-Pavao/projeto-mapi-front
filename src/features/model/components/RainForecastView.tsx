import React from 'react';
import { QueryState } from '@/components/ui/query-state';
import { useRainForecastAccuracy } from '../hooks/useRainForecastAccuracy';
import type { RainCard, RainForecastAccuracy } from '../schemas/rainForecast.schema';

const num = (v: number | null | undefined, digits = 2) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (v: number | null | undefined) => (v == null ? '—' : `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Recife', dateStyle: 'short', timeStyle: 'short' }) : null;

const th = 'px-3 py-2 text-left text-xs font-bold text-muted-foreground';
const td = 'px-3 py-2 text-[13px] text-foreground tabular-nums';
const Card: React.FC<{ title: string; note?: string; children: React.ReactNode; testId?: string }> = ({ title, note, children, testId }) => (
  <section className="rounded-2xl border border-border bg-card p-4" data-testid={testId}>
    <h2 className="m-0 text-base font-extrabold text-foreground">{title}</h2>
    {note && <p className="m-0 mt-0.5 text-xs leading-[16px] text-muted-foreground">{note}</p>}
    <div className="mt-3 overflow-x-auto">{children}</div>
  </section>
);

/** Últimos 30 dias: previsões gravadas no ciclo, conferidas contra a chuva medida pelo job diário. */
export const LiveAccuracy: React.FC<{ data: RainForecastAccuracy }> = ({ data }) => (
  <>
    <table className="w-full border-collapse" data-testid="rain-accuracy-table">
      <thead>
        <tr className="border-b border-border">
          <th className={th}>Horizonte</th><th className={th}>Previsões conferidas</th><th className={th}>Sem medida</th>
          <th className={th}>Erro de quantil (mm)</th><th className={th}>Cobertura 50%</th><th className={th}>Cobertura 80%</th>
          <th className={th}>Cobertura 95%</th><th className={th}>Chuva média medida (mm)</th><th className={th}>Eventos fortes · avisos · acertos</th>
        </tr>
      </thead>
      <tbody>
        {data.horizons.map((h) => (
          <tr key={h.horizonHours} className="border-b border-border last:border-0">
            <td className={td}>{h.horizonHours} h</td><td className={td}>{h.forecasts.toLocaleString('pt-BR')}</td>
            <td className={td}>{h.withoutMeasure.toLocaleString('pt-BR')}</td><td className={td}>{num(h.pinballMm, 3)}</td>
            <td className={td}>{pct(h.coverageQ50)}</td><td className={td}>{pct(h.coverageQ80)}</td><td className={td}>{pct(h.coverageQ95)}</td>
            <td className={td}>{num(h.meanObservedMm)}</td><td className={td}>{h.forteEvents} · {h.forteAlerts} · {h.forteHits}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p className="m-0 mt-2 text-xs text-muted-foreground">
      {when(data.lastVerifiedAt) ? `Última conferência: ${when(data.lastVerifiedAt)} (Recife).` : 'Ainda sem conferência.'}
      {' '}{data.pending.toLocaleString('pt-BR')} previsão(ões) aguardando a chuva medida. "Sem medida" não entra na conta: ausente não vira zero.
    </p>
  </>
);

export const RainForecastView: React.FC<{ card: RainCard }> = ({ card }) => {
  const query = useRainForecastAccuracy(30);
  return (
    <>
      <Card title="Acerto dos últimos 30 dias" testId="rain-accuracy-live"
        note="Previsões emitidas pelo sistema, comparadas com a chuva que os pluviômetros mediram depois. Atualiza sozinho, uma vez por dia.">
        <QueryState query={query} what="o acerto da previsão de chuva" isEmpty={(d) => d.horizons.length === 0}
          emptyTitle="Ainda não há previsão conferida." emptyHint="A primeira conferência sai no dia seguinte à primeira previsão.">
          {(d) => <LiveAccuracy data={d} />}
        </QueryState>
      </Card>
      <Card title="Teste do modelo (dado medido, sem rótulo sintético)" testId="rain-card-test"
        note={`Período de teste: ${card.testPeriod}. ${card.forteEventsInTest} eventos fortes (25,15 mm/h ou mais). Fonte: ${card.source}.`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>Horizonte</th><th className={th}>Erro de quantil (mm)</th><th className={th}>Persistência (mm)</th>
              <th className={th}>Cobertura 95%</th><th className={th}>Eventos fortes avisados</th><th className={th}>Antecedência mediana</th>
              <th className={th}>Avisos ainda sem chuva</th><th className={th}>Alarmes falsos por evento</th>
            </tr>
          </thead>
          <tbody>
            {card.horizons.map((h) => (
              <tr key={h.horizonHours} className="border-b border-border last:border-0">
                <td className={td}>{h.horizonHours} h</td><td className={td}>{num(h.pinballMm, 3)}</td><td className={td}>{num(h.pinballPersistenceMm, 3)}</td>
                <td className={td}>{pct(h.coverageQ95)}</td><td className={td}>{h.forteEventsWarned} de {card.forteEventsInTest}</td>
                <td className={td}>{num(h.leadMedianMin, 0)} min (IC 95%: {num(h.leadCi95Min[0], 0)} a {num(h.leadCi95Min[1], 0)})</td>
                <td className={td}>{num(h.warnedWhileDryPct, 1)}%</td><td className={td}>{num(h.falsePerEvent, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 mt-2 text-xs leading-[16px] text-muted-foreground">
          O modelo prevê a continuação de uma chuva que já começou. O início de uma chuva vinda do mar a rede de pluviômetros não vê:
          quase nenhum aviso sai antes de chover no ponto.
        </p>
      </Card>
      <p className="m-0 text-[11px] text-muted-foreground">{card.attribution}</p>
    </>
  );
};
