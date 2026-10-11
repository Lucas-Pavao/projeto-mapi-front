import React from 'react';
import { Mountain } from 'lucide-react';
import { useTerrainAttributes } from '../hooks/useTerrainAttributes';
import type { TerrainResponse } from '../schemas/terrain.schema';
import { fmtPt, snapAreaRange } from '../utils/provenance';
import type { TerrainState } from '../hooks/useTerrainAttributes';

/** Apresentação pura: cota da rua e área contribuinte do ponto, com unidade e incerteza. */
export const TerrainFactsView: React.FC<{ state: TerrainState }> = ({ state }) => {
  let body: React.ReactNode;
  if (state.status === 'loading') {
    body = <p className="text-xs text-zinc-400">Carregando terreno…</p>;
  } else if (state.status === 'error') {
    body = <p className="text-xs text-amber-300">Terreno indisponível (falha ao consultar a API).</p>;
  } else if (state.data.status === 'NO_DATA') {
    body = <p className="text-xs text-zinc-300">Sem dado de terreno para este ponto (fora das folhas do MDT ou sem carga).</p>;
  } else {
    body = <TerrainValues data={state.data} />;
  }
  return (
    <section data-testid="terrain-facts" aria-label="Terreno do ponto" className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
      <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-zinc-300">
        <Mountain className="h-4 w-4 text-amber-400" aria-hidden="true" /> Terreno (MDT PE3D, voo de 2016)
      </h4>
      {body}
    </section>
  );
};

const TerrainValues: React.FC<{ data: TerrainResponse }> = ({ data }) => {
  const elevation = data.streetElevationM;
  const area = data.contributingAreaM2;
  const range = snapAreaRange(data.diagnostics?.contributingAreaBySnapM2, area);
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <dt className="text-2xs font-black uppercase tracking-[0.2em] text-zinc-400">Cota da rua</dt>
        <dd className="text-2xl font-black text-white">
          {elevation != null ? fmtPt(elevation, 2) : '--'} <small className="text-xs font-bold text-zinc-400">m (datum do MDT)</small>
        </dd>
        <dd className="text-2xs leading-snug text-zinc-400">
          Datum não confirmado; não comparar com a maré. Mediana do MDT num raio de 3 m.
        </dd>
      </div>
      <div>
        <dt className="text-2xs font-black uppercase tracking-[0.2em] text-zinc-400">Área contribuinte</dt>
        <dd className="text-2xl font-black text-white">
          {area != null ? fmtPt(area, 0) : '--'} <small className="text-xs font-bold text-zinc-400">m²</small>
        </dd>
        {range ? (
          <dd data-testid="area-range" className="text-2xs leading-snug text-zinc-300">
            Faixa conforme o ponto de referência (snap de 5 a 20 m): {fmtPt(range.min, 0)} a {fmtPt(range.max, 0)} m².
          </dd>
        ) : (
          <dd data-testid="area-sensitive" className="text-2xs leading-snug text-amber-300">
            Valor sensível ao ponto de referência (a API não informou a faixa).
          </dd>
        )}
        {data.diagnostics?.basinTouchesWindowEdge === true && (
          <dd className="text-2xs leading-snug text-amber-300">A bacia toca a borda da janela de cálculo; o valor pode estar truncado.</dd>
        )}
      </div>
    </dl>
  );
};

/** Contêiner: busca o terreno do ponto e repassa à apresentação. */
export const TerrainFacts: React.FC<{ slug: string }> = ({ slug }) => <TerrainFactsView state={useTerrainAttributes(slug)} />;
