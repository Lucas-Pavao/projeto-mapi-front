import api from '@/lib/api';
import { z } from 'zod';
import { floodService } from '@/features/map/services/flood.service';
import type { FloodPointRequestDTO, FloodPointResponseDTO } from '@/features/map/types';
import { stationSuggestionSchema, type FloodPointPatch, type StationSuggestion } from '../schemas/point-admin.schema';

export const pointsAdminService = {
  /** Editar ou ativar/desativar ponto (ADMIN). Devolve o ponto no mesmo formato de GET /api/pontos/{slug}. */
  async patch(slug: string, body: FloodPointPatch): Promise<FloodPointResponseDTO> {
    const { data } = await api.patch<FloodPointResponseDTO>(`/api/pontos/${encodeURIComponent(slug)}`, body);
    return data;
  },
  /** Cadastro de ponto novo (endpoint existente, ADMIN). */
  create(body: FloodPointRequestDTO): Promise<FloodPointResponseDTO> {
    return floodService.createFloodPoint(body);
  },
  /** Estações a até `radiusM` da coordenada, por distância, para ligar ao ponto. */
  async stationSuggestions(lat: number, lon: number, radiusM = 3000): Promise<StationSuggestion[]> {
    const { data } = await api.get<unknown>('/api/pontos/station-suggestions', { params: { lat, lon, radiusM } });
    return z.array(stationSuggestionSchema).parse(data);
  },
};
