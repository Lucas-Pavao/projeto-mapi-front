import React from 'react';
import { scaleLinear } from './chartMath';
import { useElementWidth } from './useElementWidth';

export interface IntervalRow {
  id: string;
  label: string;
  value: number;
  lo: number;
  hi: number;
  /** Classe de cor de texto (currentColor). */
  colorClass: string;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/**
 * Pontos com intervalo (valor e IC) numa escala fixa. Só desenha o que recebe; o domínio é o dado
 * recebido ampliado até 0 e 1 (AUC), nunca um valor fixo "bonito" que esconda o IC.
 */
export const IntervalPlot: React.FC<{ title: string; rows: IntervalRow[]; reference?: { value: number; label: string } }> = ({ title, rows, reference }) => {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const labelW = Math.min(180, Math.round(width * 0.4));
  const innerW = Math.max(80, width - labelW - 16);
  const rowH = 30;
  const h = rows.length * rowH + 28;
  const lo = Math.min(0, ...rows.map((r) => r.lo));
  const hi = Math.max(1, ...rows.map((r) => r.hi));
  const x = scaleLinear(lo, hi, 0, innerW);
  const ticks = [0, 0.25, 0.5, 0.75, 1].filter((t) => t >= lo && t <= hi);
  return (
    <figure className="m-0" data-testid={`interval-${title}`}>
      <figcaption className="mb-1 text-body-strong text-foreground">{title}</figcaption>
      <div ref={ref} className="w-full">
        <svg width={width} height={h} role="img" aria-label={`${title}: ${rows.map((r) => `${r.label} ${fmt(r.value)} (IC ${fmt(r.lo)} a ${fmt(r.hi)})`).join('; ')}`} className="block">
          <g transform={`translate(${labelW},4)`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={0} y2={rows.length * rowH} className="stroke-border" strokeDasharray="3 4" />
                <text x={x(t)} y={rows.length * rowH + 14} textAnchor="middle" fontSize={10} className="fill-muted-foreground">{t.toLocaleString('pt-BR')}</text>
              </g>
            ))}
            {reference && <line x1={x(reference.value)} x2={x(reference.value)} y1={0} y2={rows.length * rowH} className="stroke-foreground" strokeWidth={1.5} />}
            {rows.map((r, i) => (
              <g key={r.id} transform={`translate(0,${i * rowH + rowH / 2})`} className={r.colorClass} data-row={r.id}>
                <text x={-8} y={0} textAnchor="end" dominantBaseline="middle" fontSize={11} className="fill-foreground">{r.label}</text>
                <line x1={x(r.lo)} x2={x(r.hi)} y1={0} y2={0} className="stroke-current" strokeWidth={2} />
                <line x1={x(r.lo)} x2={x(r.lo)} y1={-5} y2={5} className="stroke-current" strokeWidth={2} />
                <line x1={x(r.hi)} x2={x(r.hi)} y1={-5} y2={5} className="stroke-current" strokeWidth={2} />
                <circle cx={x(r.value)} cy={0} r={4.5} className="fill-current stroke-background" strokeWidth={1.5} />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </figure>
  );
};
