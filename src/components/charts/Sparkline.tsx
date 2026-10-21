import React from 'react';

interface Props {
  /** Valores 0–1 em ordem de tempo; nulo abre um buraco (nunca interpola). */
  values: ReadonlyArray<number | null>;
  width?: number;
  height?: number;
  /** Topo da escala (1 = 100%). Quem chama pode usar um teto menor para que séries baixas não fiquem achatadas. */
  max?: number;
  /** Classe de cor de texto; o traço usa currentColor. */
  className?: string;
}

/** Minilinha de probabilidade do protótipo (56×16, traço 1,5). Decorativa: o valor vem escrito ao lado. Sem série, linha tracejada. */
export const Sparkline: React.FC<Props> = ({ values, width = 56, height = 16, max = 1, className }) => {
  const n = values.length;
  const pad = 1.5;
  const x = (i: number) => (n <= 1 ? width / 2 : (i / (n - 1)) * width);
  const y = (v: number) => pad + (1 - Math.min(1, Math.max(0, v / max))) * (height - 2 * pad);
  const runs: string[] = [];
  let cur: string[] = [];
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (cur.length) runs.push(cur.join(' '));
      cur = [];
    } else cur.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  });
  if (cur.length) runs.push(cur.join(' '));
  const drawable = runs.filter((r) => r.includes(' '));
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className={className}>
      {drawable.length === 0 ? (
        <line x1={0} x2={width} y1={height - pad} y2={height - pad} stroke="currentColor" strokeWidth={1.5} strokeDasharray="3 3" />
      ) : (
        drawable.map((points) => <polyline key={points} points={points} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />)
      )}
    </svg>
  );
};
