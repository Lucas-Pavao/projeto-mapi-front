import api from '@/lib/api';
import { locationAnalysisSchema, type LocationAnalysis } from '../schemas/locationAnalysis.schema';

export const locationAnalysisService = {
  /** Análise de local (B7): chuva medida pelas estações até 5 km, ponto mais próximo, maré, rio, terreno e tempo. 400 se lat/lon inválidos. */
  async get(lat: number, lon: number, at?: string): Promise<LocationAnalysis> {
    const { data } = await api.get<unknown>('/api/locations/analysis', { params: { lat, lon, at } });
    return locationAnalysisSchema.parse(data);
  },
};
