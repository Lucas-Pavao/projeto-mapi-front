import React, { useMemo } from 'react';
import { scaleLinear, yDomain } from './chartMath';
import { useElementWidth } from './useElementWidth';

interface Props {
  title: string;
  unit: string;
  /** Um valor por hora, a partir da hora 1. */
  values: number[];
  kind: 'bars' | 'line';
  colorClass: string;
  height?: number;
  /** Linha horizontal de referência (ex.: h crítico). */
  hline?: { value: number; label: string };
  /** Hora (1 = primeira) a destacar com linha vertical. */
  vlineHour?: { hour: number; label: string };
  decimals?: number;
}

const M = { top: 12, right: 12, bottom: 24, left: 44 };

/** Série por hora (eixo x = nº da hora). Usada na chuva digitada e na lâmina simulada. */
export const IndexChart: React.FC<Props> = ({ title, unit, values, kind, colorClass, height = 180, hline, vlineHour, decimals = 1 }) => {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const innerW = Math.max(60, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const n = values.length;
  const m = useMemo(() => {
    const y = yDomain([...values, ...(hline ? [hline.value] : [])], { zero: true });
    return { y, yy: scaleLinear(y.min, y.max, innerH, 0), x: scaleLinear(0, Math.max(n, 1), 0, innerW) };
  }, [values, hline, n, innerH, innerW]);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 36))));
  const hours = Array.from({ length: n }, (_, i) => i + 1).filter((h) => h === 1 || h % step === 0);
  const max = n ? Math.max(...values) : 0;

  return (
    <figure className="m-0 flex flex-col gap-1" data-testid={`chart-${title}`}>
      <figcaption className="text-body-strong text-foreground">{title} <span className="text-caption font-normal text-muted-foreground">({unit})</span></figcaption>
      <div ref={ref} className="w-full">
        <svg width={width} height={height} role="img" aria-label={`${title}: ${n} hora${n === 1 ? '' : 's'}, máximo ${fmt(max)} ${unit}${hline ? `; referência ${hline.label} ${fmt(hline.value)} ${unit}` : ''}`} className="block overflow-visible">
          <g transform={`translate(${M.left},${M.top})`}>
            {m.y.ticks.map((v) => (
              <g key={v}>
                <line x1={0} x2={innerW} y1={m.yy(v)} y2={m.yy(v)} className="stroke-border" strokeDasharray={v === m.y.min ? undefined : '3 4'} />
                <text x={-6} y={m.yy(v)} textAnchor="end" dominantBaseline="middle" fontSize={10} className="fill-muted-foreground">{fmt(v)}</text>
              </g>
            ))}
            {hours.map((h) => (
              <text key={h} x={m.x(h - 0.5)} y={innerH + 16} textAnchor="middle" fontSize={10} className="fill-muted-foreground">{h}</text>
            ))}
            <g className={colorClass} data-series={kind}>
              {kind === 'bars'
                ? values.map((v, i) => (
                    <rect key={i} data-hour={i + 1} x={m.x(i) + 0.5} y={m.yy(v)} width={Math.max(1, m.x(i + 1) - m.x(i) - 1)} height={Math.max(0, m.yy(0) - m.yy(v))} className="fill-current" opacity={0.85} />
                  ))
                : n > 0 && <path d={values.map((v, i) => `${i ? 'L' : 'M'}${m.x(i + 0.5).toFixed(1)},${m.yy(v).toFixed(1)}`).join('')} fill="none" className="stroke-current" strokeWidth={2} strokeLinejoin="round" />}
            </g>
            {hline && (
              <g>
                <line x1={0} x2={innerW} y1={m.yy(hline.value)} y2={m.yy(hline.value)} className="stroke-foreground" strokeDasharray="6 3" strokeWidth={1.5} />
                <text x={innerW} y={m.yy(hline.value) - 4} textAnchor="end" fontSize={10} className="fill-foreground">{hline.label}</text>
              </g>
            )}
            {vlineHour && vlineHour.hour >= 1 && vlineHour.hour <= n && (
              <g>
                <line x1={m.x(vlineHour.hour - 0.5)} x2={m.x(vlineHour.hour - 0.5)} y1={0} y2={innerH} className="stroke-foreground" strokeDasharray="3 3" />
                <text x={m.x(vlineHour.hour - 0.5) + 4} y={10} fontSize={10} className="fill-foreground">{vlineHour.label}</text>
              </g>
            )}
          </g>
        </svg>
      </div>
      <p className="text-caption text-muted-foreground">Eixo: hora da simulação (1 = primeira).</p>
    </figure>
  );
};
