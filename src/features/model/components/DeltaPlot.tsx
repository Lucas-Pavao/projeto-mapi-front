import React from 'react';

import { signed as sg } from '../utils/format';

/** ΔAUC com o IC sobre o eixo, linha tracejada no zero. Escala: de −0,10 a +0,30, ampliada se o IC passar disso. */
export const DeltaPlot: React.FC<{ value: number; lo: number; hi: number }> = ({ value, lo, hi }) => {
  const min = Math.min(-0.1, Math.floor(lo * 10) / 10);
  const max = Math.max(0.3, Math.ceil(hi * 10) / 10);
  const x = (v: number) => (20 + ((v - min) / (max - min)) * 380).toFixed(1);
  return (
    <svg viewBox="0 0 420 70" role="img" aria-label={`Intervalo de ΔAUC de ${sg(lo)} a ${sg(hi)}${lo < 0 && hi > 0 ? ' cruzando o zero' : ''}`} className="block h-[70px] w-full">
      <line x1="20" x2="400" y1="40" y2="40" stroke="var(--border)" strokeWidth="2" />
      <line x1={x(0)} x2={x(0)} y1="12" y2="62" stroke="var(--risk-high-edge)" strokeWidth="2" strokeDasharray="4 3" />
      <text x={x(0)} y="10" textAnchor="middle" style={{ font: '700 11px var(--font-mono)' }} fill="var(--risk-high-text)">0</text>
      <line x1={x(lo)} x2={x(hi)} y1="40" y2="40" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" />
      <circle cx={x(value)} cy="40" r="8" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
      <text x="20" y="66" style={{ font: '11px var(--font-mono)' }} fill="var(--muted-foreground)">{sg(min, 2)}</text>
      <text x="400" y="66" textAnchor="end" style={{ font: '11px var(--font-mono)' }} fill="var(--muted-foreground)">{sg(max, 2)}</text>
    </svg>
  );
};
