import React from 'react';
import { formatHoraCheia } from '@/features/operacao/utils/format';
import { CHART_H, CHART_W, IDF_MM_H, STRONG_MM_H, hourlyModel, yPct } from '../utils/stationView';
import type { StationHour } from '../schemas/station.schema';

const LINES = [
  { mm: IDF_MM_H, stroke: 'var(--risk-high-edge)', text: 'text-risk-high-text', label: '50,3' },
  { mm: STRONG_MM_H, stroke: 'var(--risk-moderate)', text: 'text-risk-moderate-text', label: '25,15' },
];

/**
 * Chuva por hora (mm/h), uma barra por hora, colorida pela fonte usada (PED ou ao vivo). Hora sem dado vira faixa cinza
 * (nunca barra de zero) e o pico isolado removido vira marcador (o valor não aparece). Linhas de 25,15 (forte) e 50,3 mm/h (IDF).
 */
export const StationHourlyChart: React.FC<{ hours: StationHour[]; dim?: boolean }> = ({ hours, dim }) => {
  const m = hourlyModel(hours);
  const total = hours.filter((h) => h.valueMm != null).length;
  const ticks = [0, 1, 2, 3, 4].map((i) => {
    const h = hours[Math.min(hours.length - 1, Math.round((i * (hours.length - 1)) / 4))];
    return h ? formatHoraCheia(Date.parse(h.hourEndUtc)) : '';
  });
  return (
    <div className="relative min-h-[200px] flex-1" data-testid="station-chart">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" role="img"
           aria-label={`Chuva por hora em mm/h: ${total} de ${hours.length} horas com valor; linhas em 25,15 mm/h (forte, ≥ 25,15 mm/h) e 50,3 mm/h (IDF)`}
           className="absolute left-0 top-0 h-[calc(100%-20px)] w-[calc(100%-48px)] overflow-visible">
        {LINES.map((l) => <line key={l.label} x1="0" x2={CHART_W} y1={yPct(l.mm) * CHART_H} y2={yPct(l.mm) * CHART_H} stroke={l.stroke} strokeWidth="1.5" strokeDasharray="6 5" />)}
        {m.gaps.map((g) => <rect key={g.x} data-testid="gap" x={g.x} y="0" width={g.w} height={CHART_H} fill="var(--risk-unknown)" opacity="0.18" />)}
        {m.bars.map((b) => <rect key={b.key} data-source={b.source} x={b.x} y={b.y} width={m.slot * 0.7} height={b.h} rx="2" fill={b.source === 'CEMADEN_PED' ? 'var(--primary)' : 'var(--chart-3)'} opacity={dim ? 0.35 : 0.9} />)}
        {m.marks.map((k) => (
          <g key={k.x} data-testid="peak-mark">
            <circle cx={k.x} cy={k.y} r="7" fill="none" stroke="var(--warning)" strokeWidth="2" />
            <line x1={k.x - 5} x2={k.x + 5} y1={k.y - 5} y2={k.y + 5} stroke="var(--warning)" strokeWidth="2" />
          </g>
        ))}
      </svg>
      {LINES.map((l) => (
        <span key={l.label} aria-hidden="true" style={{ top: `calc((100% - 20px) * ${yPct(l.mm).toFixed(3)} - 8px)` }} className={`absolute right-0 font-mono text-[11px] font-bold leading-4 ${l.text}`}>{l.label}</span>
      ))}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-12 flex justify-between font-mono text-[11px] leading-4 text-muted-foreground">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
      <span className="sr-only">25,15 mm/h é chuva forte; 50,3 mm/h é o limiar IDF.</span>
    </div>
  );
};
