import React from 'react';
import { terrainLegendStops, TERRAIN_LEGEND_TICKS_M, TERRAIN_MAX_M, TERRAIN_MIN_M } from '../utils/terrain';

const pct = (valueM: number) => ((valueM - TERRAIN_MIN_M) / (TERRAIN_MAX_M - TERRAIN_MIN_M)) * 100;

/** Legenda de cotas da hipsometria: faixa de cor gerada da mesma paleta usada para gerar os tiles. */
export const TerrainLegend: React.FC = () => {
  const stops = terrainLegendStops();
  const gradient = `linear-gradient(to right, ${stops.map((s) => `${s.color} ${pct(s.valueM)}%`).join(', ')})`;
  return (
    <div data-testid="terrain-legend" className="px-3 pb-3 pt-1">
      <div
        role="img"
        aria-label={`Escala de cota do terreno, de ${TERRAIN_MIN_M} a ${TERRAIN_MAX_M} metros ou mais`}
        className="h-3 w-full rounded border border-white/20"
        style={{ backgroundImage: gradient }}
      />
      <ol className="relative mt-1 h-4 text-2xs tabular-nums text-zinc-300" aria-hidden="true">
        {TERRAIN_LEGEND_TICKS_M.map((v) => (
          <li
            key={v}
            className="absolute top-0"
            style={{ left: `${pct(v)}%`, transform: v === TERRAIN_MIN_M ? 'none' : v === TERRAIN_MAX_M ? 'translateX(-100%)' : 'translateX(-50%)' }}
          >
            {v === TERRAIN_MAX_M ? `${v}+` : v}
          </li>
        ))}
      </ol>
      <p className="mt-1 text-2xs leading-snug text-zinc-300">Cota do terreno (m).</p>
      <p className="mt-1 text-2xs leading-snug text-zinc-400">
        Datum não confirmado — cotas relativas. Fonte: MDT PE3D, voo de 2016.
      </p>
    </div>
  );
};
