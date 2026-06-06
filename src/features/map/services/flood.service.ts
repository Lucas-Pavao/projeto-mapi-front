import api from '@/lib/api';
import type { 
  FloodPointResponseDTO, 
  FloodPointRequestDTO, 
  MapiResponseDTO, 
  FloodEventDTO, 
  ScraperEventDTO,
  PreciseDataResponse
} from '../types';

export const floodService = {
  async getAllFloodPoints(): Promise<FloodPointResponseDTO[]> {
    const response = await api.get<FloodPointResponseDTO[]>('/api/pontos');
    return response.data;
  },

  async createFloodPoint(data: FloodPointRequestDTO): Promise<FloodPointResponseDTO> {
    const response = await api.post<FloodPointResponseDTO>('/api/pontos', data);
    return response.data;
  },

  async getPointStatus(id_ponto: string): Promise<MapiResponseDTO> {
    const response = await api.get<MapiResponseDTO>(`/api/pontos/${id_ponto}`);
    return response.data;
  },

  async getPreciseData(latitude: number, longitude: number): Promise<PreciseDataResponse> {
    const response = await api.get<PreciseDataResponse>('/api/precise-data', {
      params: { latitude, longitude }
    });
    return response.data;
  },

  async reportFlood(data: Partial<FloodEventDTO>): Promise<FloodEventDTO> {
    const response = await api.post<FloodEventDTO>('/api/eventos-alagamento', data);
    return response.data;
  },

  async ingestScraperEvent(data: ScraperEventDTO): Promise<FloodEventDTO> {
    const response = await api.post<FloodEventDTO>('/api/eventos-alagamento/ingest', data);
    return response.data;
  },
};
