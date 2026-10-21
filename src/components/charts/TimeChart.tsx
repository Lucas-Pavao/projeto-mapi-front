import React, { useMemo } from 'react';
import { formatRecifeDayMs, formatRecifeHourMs } from '@/features/map/utils/datetime';
import { HOUR_MS, hourBar, scaleLinear, segments, timeTicks, yDomain, type TimePt } from './chartMath';
import { useElementWidth } from './useElementWidth';

export interface ChartSeries {
  id: string;
  label: string;
  kind: 'line' | 'bars';
  points: TimePt[];
  /** Classe de cor de texto (ex.: "text-chart-1"); o desenho usa currentColor. */
  colorClass: string;
}

export interface ChartMarker {
  t: number;
  label: string;
}

interface Props {
  title: string;
  unit: string;
  from: number;
  to: number;
  series: ChartSeries[];
  height?: number;
  /** Marcas verticais (ex.: eventos de alagamento confirmados). */
  markers?: ChartMarker[];
  /** Base em 0 (chuva). */
  zero?: boolean;
  decimals?: number;
  emptyText?: string;
}

const M = { top: 10, right: 12, bottom: 24, left: 40 };

/**
 * Gráfico de série temporal em SVG. Barras de chuva horária terminam no fim da hora (`t` da API);
 * linhas (maré, rio) quebram em valor nulo, sem interpolar. Horas em America/Recife.
 * Fornece resumo textual (role="img") e tabela acessível com os mesmos dados.
 */
export const TimeChart: React.FC<Props> = ({ title, unit, from, to, series, height = 180, markers = [], zero = false, decimals = 1, emptyText = 'Sem dados na janela.' }) => {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const innerW = Math.max(60, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const hasData = series.some((s) => s.points.some((p) => p.v != null));

  const model = useMemo(() => {
    const vals = series.flatMap((s) => s.points.filter((p) => p.t >= from - HOUR_MS && p.t <= to + HOUR_MS).map((p) => p.v));
    const y = yDomain(vals, { zero });
    const x = scaleLinear(from, to, 0, innerW);
    const yy = scaleLinear(y.min, y.max, innerH, 0);
    return { y, x, yy, xt: timeTicks(from, to, Math.max(2, Math.floor(innerW / 70))) };
  }, [series, from, to, zero, innerW, innerH]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const spanHours = (to - from) / HOUR_MS;
  const tickLabel = (t: number) => (spanHours > 30 && new Date(t).getUTCHours() === 3 ? formatRecifeDayMs(t) : formatRecifeHourMs(t));

  const summary = useMemo(() => {
    return series
      .map((s) => {
        const vs = s.points.filter((p) => p.v != null).map((p) => p.v as number);
        if (vs.length === 0) return `${s.label}: sem dados`;
        return `${s.label}: mínimo ${fmt(Math.min(...vs))} ${unit}, máximo ${fmt(Math.max(...vs))} ${unit}`;
      })
      .join('; ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, unit, decimals]);

  return (
    <figure className="m-0 flex flex-col gap-1" data-testid={`chart-${title}`}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 text-body-strong text-foreground">
        <span>{title} <span className="text-caption font-normal text-muted-foreground">({unit})</span></span>
        <ul className="flex flex-wrap gap-x-3 text-caption font-normal text-muted-foreground">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1">
              <span aria-hidden="true" className={`inline-block h-0.5 w-4 bg-current ${s.colorClass} ${s.kind === 'bars' ? 'h-2 w-2' : ''}`} />
              {s.label}
            </li>
          ))}
        </ul>
      </figcaption>
      <div ref={ref} className="w-full">
        {hasData ? (
          <svg width={width} height={height} role="img" aria-label={`${title}. ${summary}.`} className="block overflow-visible">
            <g transform={`translate(${M.left},${M.top})`}>
              {model.y.ticks.map((v) => (
                <g key={v}>
                  <line x1={0} x2={innerW} y1={model.yy(v)} y2={model.yy(v)} className="stroke-border" strokeDasharray={v === model.y.min ? undefined : '3 4'} />
                  <text x={-6} y={model.yy(v)} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground" fontSize={10}>{fmt(v)}</text>
                </g>
              ))}
              {model.xt.map((t) => (
                <g key={t}>
                  <line x1={model.x(t)} x2={model.x(t)} y1={innerH} y2={innerH + 4} className="stroke-border" />
                  <text x={model.x(t)} y={innerH + 16} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>{tickLabel(t)}</text>
                </g>
              ))}
              {series.map((s) =>
                s.kind === 'bars' ? (
                  <g key={s.id} className={s.colorClass} data-series={s.id}>
                    {s.points.map((p) => {
                      if (p.v == null) return null;
                      const b = hourBar(p.t, from, to);
                      if (!b) return null;
                      const x0 = model.x(b.start);
                      const x1 = model.x(b.end);
                      const y = model.yy(Math.max(p.v, 0));
                      const base = model.yy(Math.max(model.y.min, 0));
                      return <rect key={p.t} data-bar-end={p.t} x={x0 + 0.5} y={y} width={Math.max(1, x1 - x0 - 1)} height={Math.max(0, base - y)} className="fill-current" opacity={0.85} />;
                    })}
                  </g>
                ) : (
                  <g key={s.id} className={s.colorClass} data-series={s.id}>
                    {segments(s.points).map((seg, i) =>
                      seg.length === 1 ? (
                        <circle key={i} cx={model.x(seg[0].t)} cy={model.yy(seg[0].v)} r={2} className="fill-current" />
                      ) : (
                        <path key={i} d={seg.map((p, j) => `${j ? 'L' : 'M'}${model.x(p.t).toFixed(1)},${model.yy(p.v).toFixed(1)}`).join('')} fill="none" className="stroke-current" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                      ),
                    )}
                  </g>
                ),
              )}
              {markers.filter((m) => m.t >= from && m.t <= to).map((m) => (
                <g key={`${m.t}-${m.label}`}>
                  <line x1={model.x(m.t)} x2={model.x(m.t)} y1={0} y2={innerH} className="stroke-foreground" strokeDasharray="4 3" opacity={0.7} />
                  <text x={model.x(m.t) + 3} y={9} className="fill-foreground" fontSize={10}>{m.label}</text>
                </g>
              ))}
            </g>
          </svg>
        ) : (
          <p className="flex items-center justify-center rounded-lg border border-dashed border-border p-6 text-caption text-muted-foreground" style={{ minHeight: height }}>{emptyText}</p>
        )}
      </div>
    </figure>
  );
};
