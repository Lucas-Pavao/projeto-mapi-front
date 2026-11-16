import React from 'react';
import { pctTxt } from '@/components/risk/thresholds';
import { formatRecifeHourMs } from '../../utils/datetime';
import { seriesModel, yScaled } from '../utils/pointView';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';
import type { RiskThresholds } from '@/features/map/schemas/floodPointResponse.schema';

interface Props {
  items: readonly PredictionSummary[];
  now: number;
  width: number;
  height: number;
  hours?: number;
  /** Limiares do ponto quando a série não os traz (ex.: previsão UNKNOWN mais recente). */
  fallbackThresholds?: RiskThresholds | null;
  strokeWidth?: number;
}

/** Probabilidade das últimas horas em escala de raiz quadrada, com as faixas dos limiares da API e trecho sem previsão tracejado. */
export const PointProbabilityChart: React.FC<Props> = ({ items, now, width: W, height: H, hours = 12, fallbackThresholds, strokeWidth = 2.2 }) => {
  const m = seriesModel(items, now, hours);
  const th = m.thresholds ?? fallbackThresholds ?? null;
  const yHigh = th ? yScaled(th.high, H) : null;
  const yMed = th ? yScaled(th.medium, H) : null;
  const pts = (r: SeriesRunLike) => r.map((q) => `${(q.x * W).toFixed(1)},${yScaled(q.p, H).toFixed(1)}`).join(' ');
  const label = `Probabilidade das últimas ${hours} h em escala de raiz quadrada${th ? `; moderado a partir de ${pctTxt(th.medium)}, alto a partir de ${pctTxt(th.high)}` : '; sem limiares de risco'}${m.gaps.length ? '; com trecho sem previsão' : ''}`;
  return (
    <div data-testid="point-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className="block w-full" style={{ height: H }}>
        {yHigh != null && yMed != null && (
          <>
            <rect x="0" y="0" width={W} height={yHigh} fill="var(--risk-high)" opacity="0.12" />
            <rect x="0" y={yHigh} width={W} height={yMed - yHigh} fill="var(--risk-moderate)" opacity="0.1" />
            <line x1="0" x2={W} y1={yHigh} y2={yHigh} stroke="var(--risk-high-edge)" strokeDasharray="4 3" />
            <line x1="0" x2={W} y1={yMed} y2={yMed} stroke="var(--risk-moderate)" strokeDasharray="4 3" />
          </>
        )}
        {m.runs.filter((r) => r.length > 0).map((r, i) => (
          <React.Fragment key={i}>
            <polygon points={`${(r[0].x * W).toFixed(1)},${H} ${pts(r)} ${(r[r.length - 1].x * W).toFixed(1)},${H}`} fill="var(--primary)" opacity="0.18" />
            <polyline points={pts(r)} fill="none" stroke="var(--primary)" strokeWidth={strokeWidth} />
          </React.Fragment>
        ))}
        {m.gaps.map((g) => <rect key={g.x0} data-testid="chart-gap" x={g.x0 * W} y="0" width={Math.max(4, (g.x1 - g.x0) * W)} height={H} fill="none" stroke="var(--risk-unknown-edge)" strokeDasharray="3 3" />)}
        <line x1={W - 1} x2={W - 1} y1="0" y2={H} stroke="var(--foreground)" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between font-mono text-[10px] leading-[14px] text-muted-foreground">
        <span>{formatRecifeHourMs(now - hours * 3_600_000)}</span>
        <span>{formatRecifeHourMs(now)}</span>
      </div>
      <p className="font-mono text-[10px] leading-[14px] text-muted-foreground">{th ? `escala raiz · alto ≥ ${pctTxt(th.high)} · mod. ≥ ${pctTxt(th.medium)}` : 'sem limiares'}</p>
    </div>
  );
};

type SeriesRunLike = Array<{ x: number; p: number }>;
