import React from 'react';
import { formatHoraCheia } from '@/features/operacao/utils/format';
import { pctTxt } from '@/components/risk/thresholds';
import type { RiskThresholds } from '@/features/map/schemas/floodPointResponse.schema';
import { bandsOf, chartWindow, probabilityRuns, toArea, toPoints, VB_H, VB_W, xOf, yOf } from '../utils/probabilitySeries';
import type { PredictionSummary } from '../schemas/prediction.schema';

/**
 * Probabilidade das últimas 9 h e das próximas 3 h, em escala de raiz quadrada, com as faixas dos limiares que a API
 * enviou (`riskThresholds`) e a marca "agora". Sem limiares não há faixa nem classe. UNKNOWN quebra a linha: nunca vira 0 %.
 */
export const ProbabilityChart: React.FC<{ items: PredictionSummary[]; now: number; latest: PredictionSummary | null; thresholds?: RiskThresholds | null }> = ({ items, now, latest, thresholds }) => {
  const w = chartWindow(now);
  const runs = probabilityRuns(items, w).filter((r) => r.points.length > 0);
  const nowX = xOf(now, w);
  const showDot = latest && latest.riskLevel !== 'UNKNOWN' && latest.probability != null;
  const ticks = [0, 1, 2, 3, 4].map((i) => formatHoraCheia(w.t0 + ((w.t1 - w.t0) * i) / 4));
  const b = bandsOf(thresholds);
  const label = thresholds
    ? `Probabilidade das últimas 9 h e das próximas 3 h, em escala de raiz quadrada, com os limiares do modelo: moderado a partir de ${pctTxt(thresholds.medium)}, alto a partir de ${pctTxt(thresholds.high)}`
    : 'Probabilidade das últimas 9 h e das próximas 3 h, em escala de raiz quadrada, sem limiares de risco disponíveis';
  return (
    <div className="relative min-h-[140px] flex-1" data-testid="probability-chart">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="absolute left-0 top-0 h-[calc(100%-20px)] w-[calc(100%-40px)] overflow-visible"
      >
        {b && (
          <>
            <rect x="0" y="0" width={VB_W} height={b.yHigh} fill="var(--risk-high)" opacity="0.12" />
            <rect x="0" y={b.yHigh} width={VB_W} height={b.yMed - b.yHigh} fill="var(--risk-moderate)" opacity="0.10" />
            <rect x="0" y={b.yMed} width={VB_W} height={VB_H - b.yMed} fill="var(--risk-low)" opacity="0.07" />
            <line x1="0" x2={VB_W} y1={b.yHigh} y2={b.yHigh} stroke="var(--risk-high-edge)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" x2={VB_W} y1={b.yMed} y2={b.yMed} stroke="var(--risk-moderate)" strokeWidth="1" strokeDasharray="4 4" />
          </>
        )}
        {runs.map((r, i) => (
          <React.Fragment key={i}>
            <polygon points={toArea(r)} fill="var(--primary)" opacity="0.18" />
            <polyline points={toPoints(r)} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
          </React.Fragment>
        ))}
        <line x1={nowX} x2={nowX} y1="0" y2={VB_H} stroke="var(--foreground)" strokeWidth="1.5" />
        {showDot && <circle cx={nowX} cy={yOf(latest.probability as number)} r="6" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />}
      </svg>
      {b && thresholds && (
        <>
          <span aria-hidden="true" data-testid="threshold-high" style={{ top: `calc((100% - 20px) * ${(b.yHigh / VB_H).toFixed(3)} - 8px)` }} className="absolute right-0 font-mono text-[11px] font-semibold leading-4 text-risk-high-text">{pctTxt(thresholds.high)}</span>
          <span aria-hidden="true" data-testid="threshold-medium" style={{ top: `calc((100% - 20px) * ${(b.yMed / VB_H).toFixed(3)} - 8px)` }} className="absolute right-0 font-mono text-[11px] font-semibold leading-4 text-risk-moderate-text">{pctTxt(thresholds.medium)}</span>
        </>
      )}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-10 flex justify-between font-mono text-[11px] leading-4 text-muted-foreground">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
};
