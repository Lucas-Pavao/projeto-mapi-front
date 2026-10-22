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
    body = <p className="text-xs text-muted-foreground">Carregando terreno…</p>;
  } else if (state.status === 'error') {
    body = <p className="text-xs text-warning">Terreno indisponível (falha ao consultar a API).</p>;
  } else if (state.data.status === 'NO_DATA') {
    body = <p className="text-xs text-foreground">Sem dado de terreno para este ponto (fora das folhas do MDT ou sem carga).</p>;
  } else {
    body = <TerrainValues data={state.data} />;
  }
  return (
    <section data-testid="terrain-facts" aria-label="Terreno do ponto" className="rounded-2xl border border-border bg-muted p-6">
      <h4 className="mb-3 flex items-center gap-2 text-xs font-bold text-foreground">
        <Mountain className="h-4 w-4 text-warning" aria-hidden="true" /> Terreno (MDT PE3D, voo de 2016)
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
        <dt className="text-2xs font-bold text-muted-foreground">Cota da rua</dt>
        <dd className="text-2xl font-bold text-foreground">
          {elevation != null ? fmtPt(elevation, 2) : '--'} <small className="text-xs font-bold text-muted-foreground">m (datum do MDT)</small>
        </dd>
        <dd className="text-2xs leading-snug text-muted-foreground">
          Datum não confirmado; não comparar com a maré. Mediana do MDT num raio de 3 m.
        </dd>
      </div>
      <div>
        <dt className="text-2xs font-bold text-muted-foreground">Área contribuinte</dt>
        <dd className="text-2xl font-bold text-foreground">
          {area != null ? fmtPt(area, 0) : '--'} <small className="text-xs font-bold text-muted-foreground">m²</small>
        </dd>
        {range ? (
          <dd data-testid="area-range" className="text-2xs leading-snug text-foreground">
            Faixa conforme o ponto de referência (snap de 5 a 20 m): {fmtPt(range.min, 0)} a {fmtPt(range.max, 0)} m².
          </dd>
        ) : (
          <dd data-testid="area-sensitive" className="text-2xs leading-snug text-warning">
            Valor sensível ao ponto de referência (a API não informou a faixa).
          </dd>
        )}
        {data.diagnostics?.basinTouchesWindowEdge === true && (
          <dd className="text-2xs leading-snug text-warning">A bacia toca a borda da janela de cálculo; o valor pode estar truncado.</dd>
        )}
      </div>
    </dl>
  );
};

/** Contêiner: busca o terreno do ponto e repassa à apresentação. */
export const TerrainFacts: React.FC<{ slug: string }> = ({ slug }) => <TerrainFactsView state={useTerrainAttributes(slug)} />;
