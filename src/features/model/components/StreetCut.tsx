import React from 'react';

interface StreetCutProps {
  /** Lâmina na rua (mm) no instante do cursor. */
  hMm: number;
  hcritMm: number;
  /** Chuva (mm/h) no instante do cursor; define quantas gotas caem. */
  rainMmH: number;
  cursorText: string;
}

const SCALE = 140; // px por metro, como no protótipo
const GROUND = 200;
const STREET_Y = GROUND - 0.35 * SCALE; // cota da rua esquemática (a API não devolve a geometria)

/** Corte esquemático da rua: lâmina d'água do cursor, linha do h crítico, depressão e galeria. Ilustrativo. */
export const StreetCut: React.FC<StreetCutProps> = ({ hMm, hcritMm, rainMmH, cursorText }) => {
  const sheet = Math.min(hMm / 1000, 1.25 - 0.35) * SCALE;
  const sheetY = STREET_Y - sheet;
  const critY = STREET_Y - (hcritMm / 1000) * SCALE;
  const drops = Array.from({ length: Math.min(28, Math.round(rainMmH / 4)) }, (_, d) => {
    const x = 30 + ((d * 97) % 580);
    const y = 6 + ((d * 53) % 40);
    return { x, y };
  });
  return (
    <svg viewBox="0 0 640 260" role="img" aria-label={`Corte esquemático: lâmina d'água de ${(hMm / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm na rua, ${cursorText}`} className="block min-h-0 w-full flex-1">
      {drops.map((d, i) => (
        <line key={i} x1={d.x} x2={d.x - 4} y1={d.y} y2={d.y + 12} stroke="var(--chart-3)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      ))}
      <rect x="20" y={STREET_Y} width="600" height={260 - STREET_Y} fill="var(--muted)" />
      <rect x="140" y={STREET_Y} width="320" height={GROUND - STREET_Y} fill="var(--background)" />
      <rect x="20" y={sheetY} width="600" height={Math.max(0, STREET_Y - sheetY)} fill="var(--primary)" opacity="0.4" />
      <line x1="20" x2="620" y1={STREET_Y} y2={STREET_Y} stroke="var(--foreground)" strokeWidth="3" />
      <line x1="20" x2="620" y1={critY} y2={critY} stroke="var(--risk-high-edge)" strokeWidth="1.5" strokeDasharray="6 5" />
      <text x="24" y={critY - 6} style={{ font: '600 11px var(--font-mono)' }} fill="var(--risk-high-text)">{(hcritMm / 10).toLocaleString('pt-BR')} cm na rua (h_crit)</text>
      <rect x="470" y={GROUND - 30} width="150" height="16" rx="8" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" />
      <text x="478" y={GROUND - 36} style={{ font: '11px var(--font-sans)' }} fill="var(--muted-foreground)">galeria → canal</text>
      <text x="150" y={GROUND - 8} style={{ font: '11px var(--font-sans)' }} fill="var(--muted-foreground)">depressão (esquemático)</text>
    </svg>
  );
};
