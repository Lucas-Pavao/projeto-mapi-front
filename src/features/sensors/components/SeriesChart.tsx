import React from 'react';
import { formatHoraCheia } from '@/features/operacao/utils/format';
import { HOUR_MS, hourBar, segments, type TimePt } from '@/components/charts/chartMath';

export const W = 720;
export const H = 260;

export interface RefLine { value: number; color: string; text: string; label: string }
interface Props {
  label: string;
  t0: number;
  t1: number;
  now: number;
  yMin: number;
  yMax: number;
  color: string;
  /** Linha contínua até agora (rio, maré) ou barras horárias (chuva). */
  mode: 'line' | 'bars';
  points: TimePt[];
  /** Série inteira (também o futuro), em pontilhado cinza. */
  ghost?: TimePt[];
  lines?: RefLine[];
  /** Barras em âmbar a partir deste valor. */
  amberFrom?: number;
}

/** Série do dia em SVG próprio (720 × 260, preserveAspectRatio none), com linhas de referência e marca "agora". */
export const SeriesChart: React.FC<Props> = ({ label, t0, t1, now, yMin, yMax, color, mode, points, ghost, lines = [], amberFrom }) => {
  const x = (t: number) => ((t - t0) / (t1 - t0)) * W;
  const y = (v: number) => H - ((v - yMin) / (yMax - yMin)) * H;
  const pct = (v: number) => (1 - (v - yMin) / (yMax - yMin)).toFixed(3);
  const line = (pts: TimePt[], until = Infinity) =>
    segments(pts.filter((p) => p.t <= until && p.t >= t0 && p.t <= t1)).map((s) => s.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' '));
  const ticks = [0, 1, 2, 3, 4].map((i) => formatHoraCheia(t0 + ((t1 - t0) * i) / 4));
  const bars = mode === 'bars'
    ? points.flatMap((p) => {
        const b = p.v != null && p.t <= now + HOUR_MS ? hourBar(p.t, t0, t1) : null;
        if (!b || p.v == null) return [];
        const h = Math.max(0, ((p.v - Math.max(0, yMin)) / (yMax - yMin)) * H);
        return [{ k: p.t, x: x(b.start) + 1, w: Math.max(2, x(b.end) - x(b.start) - 2), y: H - h, h, amber: amberFrom != null && p.v >= amberFrom }];
      })
    : [];
  return (
    <div className="relative min-h-[140px] flex-1" data-testid="series-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className="absolute left-0 top-0 h-[calc(100%-20px)] w-[calc(100%-48px)] overflow-visible">
        {lines.map((l) => <line key={l.label} x1="0" x2={W} y1={y(l.value)} y2={y(l.value)} stroke={l.color} strokeWidth="1.5" strokeDasharray="6 5" />)}
        {bars.map((b) => <rect key={b.k} x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill={b.amber ? 'var(--risk-moderate)' : color} />)}
        {ghost && line(ghost).map((p, i) => <polyline key={`g${i}`} points={p} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.5" />)}
        {mode === 'line' && line(points, now).map((p, i) => <polyline key={i} points={p} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" />)}
        <line x1={x(now)} x2={x(now)} y1="0" y2={H} stroke="var(--foreground)" strokeWidth="1.5" />
      </svg>
      {lines.map((l) => (
        <span key={l.label} aria-hidden="true" className="absolute right-0 font-mono text-[11px] font-bold leading-4" style={{ top: `calc((100% - 20px) * ${pct(l.value)} - 8px)`, color: l.text }}>{l.label}</span>
      ))}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-12 flex justify-between font-mono text-[11px] leading-4 text-muted-foreground">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
};
