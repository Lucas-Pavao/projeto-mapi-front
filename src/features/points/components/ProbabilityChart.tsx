import React from 'react';
import { formatHoraCheia } from '@/features/operacao/utils/format';
import { chartWindow, probabilityRuns, toArea, toPoints, VB_H, VB_W, xOf, yOf } from '../utils/probabilitySeries';
import type { PredictionSummary } from '../schemas/prediction.schema';

/**
 * Probabilidade ao longo das últimas 9 h e das próximas 3 h, com faixas de risco (50 % e 80 %) e marca "agora".
 * SVG próprio, na escala do protótipo (640 × 200, y = (1 − p) · 200). UNKNOWN quebra a linha: nunca vira 0 %.
 */
export const ProbabilityChart: React.FC<{ items: PredictionSummary[]; now: number; latest: PredictionSummary | null }> = ({ items, now, latest }) => {
  const w = chartWindow(now);
  const runs = probabilityRuns(items, w).filter((r) => r.points.length > 0);
  const nowX = xOf(now, w);
  const showDot = latest && latest.riskLevel !== 'UNKNOWN' && latest.probability != null;
  const ticks = [0, 1, 2, 3, 4].map((i) => formatHoraCheia(w.t0 + ((w.t1 - w.t0) * i) / 4));
  return (
    <div className="relative min-h-[140px] flex-1" data-testid="probability-chart">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Probabilidade das últimas 9 h e das próximas 3 h com faixas de risco: baixo até 50%, moderado até 80%, alto acima"
        className="absolute left-0 top-0 h-[calc(100%-20px)] w-[calc(100%-40px)] overflow-visible"
      >
        <rect x="0" y="0" width={VB_W} height="40" fill="var(--risk-high)" opacity="0.12" />
        <rect x="0" y="40" width={VB_W} height="60" fill="var(--risk-moderate)" opacity="0.10" />
        <rect x="0" y="100" width={VB_W} height="100" fill="var(--risk-low)" opacity="0.07" />
        <line x1="0" x2={VB_W} y1="40" y2="40" stroke="var(--risk-high-edge)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="0" x2={VB_W} y1="100" y2="100" stroke="var(--risk-moderate)" strokeWidth="1" strokeDasharray="4 4" />
        {runs.map((r, i) => (
          <React.Fragment key={i}>
            <polygon points={toArea(r)} fill="var(--primary)" opacity="0.18" />
            <polyline points={toPoints(r)} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
          </React.Fragment>
        ))}
        <line x1={nowX} x2={nowX} y1="0" y2={VB_H} stroke="var(--foreground)" strokeWidth="1.5" />
        {showDot && <circle cx={nowX} cy={yOf(latest.probability as number)} r="6" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />}
      </svg>
      <span aria-hidden="true" className="absolute right-0 top-[calc((100%-20px)*0.2-8px)] font-mono text-[11px] font-semibold leading-4 text-risk-high-text">80%</span>
      <span aria-hidden="true" className="absolute right-0 top-[calc((100%-20px)*0.5-8px)] font-mono text-[11px] font-semibold leading-4 text-risk-moderate-text">50%</span>
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-10 flex justify-between font-mono text-[11px] leading-4 text-muted-foreground">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
};
