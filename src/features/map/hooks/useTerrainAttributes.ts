import { useEffect, useState } from 'react';
import { terrainService } from '../services/terrain.service';
import type { TerrainResponse } from '../schemas/terrain.schema';

export type TerrainState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: TerrainResponse };

/** Busca os atributos de terreno do ponto; refaz ao trocar de ponto e ignora resposta atrasada. */
export const useTerrainAttributes = (slug: string): TerrainState => {
  const [state, setState] = useState<{ slug: string; value: TerrainState }>({ slug, value: { status: 'loading' } });

  useEffect(() => {
    let cancelled = false;
    terrainService
      .getTerrain(slug)
      .then((data) => !cancelled && setState({ slug, value: { status: 'ready', data } }))
      .catch((error: unknown) => {
        console.error('[terrain] Falha ao obter terreno do ponto:', error);
        if (!cancelled) setState({ slug, value: { status: 'error' } });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state.slug === slug ? state.value : { status: 'loading' };
};
