import React, { useMemo } from 'react';
import { scaleLinear } from '@/components/charts/chartMath';
import { pctTxt, sqrtScale } from '@/components/risk/thresholds';
import { usePredictionSeries } from '@/features/points/hooks/usePredictionSeries';
import { bandsOf } from '@/features/points/utils/probabilitySeries';

const W = 354;
const H = 90;

/**
 * Probabilidade das últimas 24 h no celular, em escala de raiz quadrada, com as faixas dos limiares que a API enviou.
 * Sem limiares não há faixa; previsão UNKNOWN ou sem valor abre buraco na linha (nunca vira 0 %).
 */
export const MobileProbabilityChart: React.FC<{ slug: string }> = ({ slug }) => {
  const series = usePredictionSeries(slug, 24);
  const m = useMemo(() => {
    const items = [...(series.data?.items ?? [])].sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
    const from = Date.parse(series.data?.from ?? '');
    const to = Date.parse(series.data?.to ?? '');
    // Sem janela válida não há eixo de tempo: nada é desenhado (estado vazio), nem com valores inventados.
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
    const x = scaleLinear(from, to, 0, W);
    const y = (p: number) => H - sqrtScale(p) * H;
    const runs: Array<Array<[number, number]>> = [];
    let cur: Array<[number, number]> = [];
    for (const i of items) {
      const t = Date.parse(i.issuedAt);
      if (i.riskLevel === 'UNKNOWN' || i.probability == null || !Number.isFinite(t)) {
        if (cur.length) runs.push(cur);
        cur = [];
      } else cur.push([x(t), y(i.probability)]);
    }
    if (cur.length) runs.push(cur);
    const vals = items.filter((i) => i.riskLevel !== 'UNKNOWN' && i.probability != null).map((i) => i.probability as number);
    const th = [...items].reverse().find((i) => i.riskThresholds)?.riskThresholds ?? null;
    const b = bandsOf(th);
    const pts = (r: Array<[number, number]>) => r.map(([a, c]) => `${a.toFixed(1)},${c.toFixed(1)}`).join(' ');
    return {
      th,
      yHigh: b ? (b.yHigh / 200) * H : null,
      yMed: b ? (b.yMed / 200) * H : null,
      lines: runs.filter((r) => r.length > 1).map(pts),
      areas: runs.filter((r) => r.length > 1).map((r) => `${r[0][0].toFixed(1)},${H} ${pts(r)} ${r[r.length - 1][0].toFixed(1)},${H}`),
      nowX: x(to),
      label: (vals.length ? `Probabilidade nas últimas 24 horas, em escala de raiz quadrada: de ${pctTxt(Math.min(...vals))} a ${pctTxt(Math.max(...vals))}` : 'Probabilidade nas últimas 24 horas: sem previsão válida na janela')
        + (th ? `. Limiares: moderado a partir de ${pctTxt(th.medium)}, alto a partir de ${pctTxt(th.high)}` : '. Sem limiares de risco disponíveis'),
    };
  }, [series.data]);
  if (!m) return <p data-testid="mobile-chart-empty" className="m-0 flex h-[90px] items-center text-[13px] text-muted-foreground">{series.isError ? 'Não foi possível carregar as previsões.' : 'Sem previsões na janela.'}</p>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={m.label} className="block h-[90px] w-full" data-testid="mobile-chart">
      {m.yHigh != null && m.yMed != null && (
        <>
          <rect x={0} y={0} width={W} height={m.yHigh} fill="var(--risk-high)" opacity={0.12} />
          <rect x={0} y={m.yHigh} width={W} height={m.yMed - m.yHigh} fill="var(--risk-moderate)" opacity={0.1} />
        </>
      )}
      {m.areas.map((p) => <polygon key={p.slice(0, 30)} points={p} fill="var(--primary)" opacity={0.2} />)}
      {m.lines.map((p) => <polyline key={p.slice(0, 30)} points={p} fill="none" stroke="var(--primary)" strokeWidth={2.5} />)}
      <line x1={m.nowX} x2={m.nowX} y1={0} y2={H} stroke="var(--foreground)" strokeWidth={1.5} />
    </svg>
  );
};
