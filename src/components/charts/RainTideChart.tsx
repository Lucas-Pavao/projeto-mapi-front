import React, { useMemo } from 'react';
import { scaleLinear, segments, type TimePt } from './chartMath';

interface Props {
  rain: readonly TimePt[];
  tide: readonly TimePt[];
  from: number;
  to: number;
  now: number;
  label: string;
}

const W = 272;
const H = 92;

const path = (runs: Array<Array<{ t: number; v: number }>>, x: (t: number) => number, y: (v: number) => number) => runs.filter((r) => r.length > 1).map((r) => r.map((p) => `${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' '));

/**
 * Gráfico "Chuva e maré hoje" do mapa (272×92): chuva média das estações em área azul (chart-1), maré em linha areia
 * (sand) e a marca vertical de agora. Mesmas cores e traços do protótipo; escalas vêm dos dados da janela.
 */
export const RainTideChart: React.FC<Props> = ({ rain, tide, from, to, now, label }) => {
  const m = useMemo(() => {
    const x = scaleLinear(from, to, 0, W);
    const rv = rain.map((p) => p.v).filter((v): v is number => v != null);
    const tv = tide.map((p) => p.v).filter((v): v is number => v != null);
    const rMax = Math.max(5, ...rv) * 1.15;
    const tMin = Math.min(0, ...tv);
    const tMax = Math.max(2.6, ...tv);
    const yr = scaleLinear(0, rMax, H, 0);
    const yt = scaleLinear(tMin, tMax, H, 0);
    const rainRuns = segments(rain);
    const area = rainRuns.filter((r) => r.length > 1).map((r) => `${x(r[0].t).toFixed(1)},${H} ${r.map((p) => `${x(p.t).toFixed(1)},${yr(p.v).toFixed(1)}`).join(' ')} ${x(r[r.length - 1].t).toFixed(1)},${H}`);
    return { x, area, rainLines: path(rainRuns, x, yr), tideLines: path(segments(tide), x, yt) };
  }, [rain, tide, from, to]);
  const nowX = m.x(now);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-[92px] w-full overflow-visible">
      {m.area.map((points) => <polygon key={points.slice(0, 40)} points={points} fill="var(--chart-1)" opacity={0.35} />)}
      {m.rainLines.map((points) => <polyline key={points.slice(0, 40)} points={points} fill="none" stroke="var(--chart-1)" strokeWidth={2} />)}
      {m.tideLines.map((points) => <polyline key={points.slice(0, 40)} points={points} fill="none" stroke="var(--sand)" strokeWidth={2} strokeLinejoin="round" />)}
      {nowX >= 0 && nowX <= W && <line x1={nowX} x2={nowX} y1={0} y2={H} stroke="var(--foreground)" strokeWidth={1.5} />}
    </svg>
  );
};
