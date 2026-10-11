import api from '@/lib/api';
import { validateTerrain, type TerrainResponse } from '../schemas/terrain.schema';

export const terrainService = {
  /** Atributos do terreno PE3D do ponto (cota da rua, área contribuinte, diagnóstico de snap). */
  async getTerrain(slug: string): Promise<TerrainResponse> {
    const response = await api.get<unknown>(`/api/pontos/${encodeURIComponent(slug)}/terrain`);
    return validateTerrain(response.data);
  },
};
