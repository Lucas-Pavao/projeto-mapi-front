import React from 'react';

interface BucketChartProps {
  rain: number[];
  hMm: number[];
  capacityMmH: number;
  hcritMm: number;
  /** Cursor em horas desde o início (0 a n). */
  cursor: number;
}

const W = 400;
const H = 230;
const RAIN_MAX = 120;
const H_MAX = 600;
const y = (v: number, max: number) => (H - (Math.min(Math.max(v, 0), max) / max) * H).toFixed(1);

/** Chuva (área) × lâmina na rua (linha), com a capacidade f·i_T e o h crítico. Dados da simulação, nada inventado. */
export const BucketChart: React.FC<BucketChartProps> = ({ rain, hMm, capacityMmH, hcritMm, cursor }) => {
  const n = hMm.length;
  const x = (i: number) => ((i / n) * W).toFixed(1);
  const rainArea = [`0,${H}`, ...rain.slice(0, n).flatMap((r, i) => [`${x(i)},${y(r, RAIN_MAX)}`, `${x(i + 1)},${y(r, RAIN_MAX)}`]), `${W},${H}`].join(' ');
  const hLine = [`0,${y(0, H_MAX)}`, ...hMm.map((v, i) => `${x(i + 1)},${y(v, H_MAX)}`)].join(' ');
  const cap = y(capacityMmH, RAIN_MAX);
  const hc = y(hcritMm, H_MAX);
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Chuva (área) e lâmina d'água na rua (linha) ao longo de ${n} horas`} className="block min-h-0 w-full flex-1 overflow-visible">
        <polygon points={rainArea} fill="var(--chart-3)" opacity="0.35" />
        <line x1="0" x2={W} y1={cap} y2={cap} stroke="var(--chart-3)" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2={W} y1={hc} y2={hc} stroke="var(--risk-high-edge)" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <polyline points={hLine} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line x1={x(Math.min(cursor, n))} x2={x(Math.min(cursor, n))} y1="0" y2={H} stroke="var(--foreground)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex flex-wrap gap-2.5 text-[11px] leading-[14px] text-muted-foreground">
        <span className="flex items-center gap-[5px]"><span className="size-2.5 bg-chart-3 opacity-60" />chuva (0–120 mm/h)</span>
        <span className="flex items-center gap-[5px]"><span className="h-0.5 w-3 bg-chart-3" />capacidade f·i_T</span>
        <span className="flex items-center gap-[5px]"><span className="h-[3px] w-3 bg-primary" />lâmina (0–600 mm)</span>
        <span className="flex items-center gap-[5px]"><span className="h-0.5 w-3 bg-risk-high-edge" />{(hcritMm / 10).toLocaleString('pt-BR')} cm</span>
      </div>
    </>
  );
};
