import api from '@/lib/api';
import { validateFloodPoint } from '../schemas/floodPointResponse.schema';
import type {
  FloodPointResponseDTO,
  FloodPointRequestDTO,
  FloodEventDTO,
  ScraperEventDTO,
  MapiResponseDTO
} from '../types';

export const floodService = {
  async getAllFloodPoints(): Promise<FloodPointResponseDTO[]> {
    const response = await api.get<FloodPointResponseDTO[]>('/api/pontos');
    return response.data.map(validateFloodPoint);
  },

  async createFloodPoint(data: FloodPointRequestDTO): Promise<FloodPointResponseDTO> {
    const response = await api.post<FloodPointResponseDTO>('/api/pontos', data);
    return validateFloodPoint(response.data);
  },

  async getPointStatus(slug: string): Promise<FloodPointResponseDTO> {
    const response = await api.get<FloodPointResponseDTO>(`/api/pontos/${slug}`);
    return validateFloodPoint(response.data);
  },

  // Dado ambiental agregado (sensores, clima, maré, ondas) pra uma coordenada — leitura pura,
  // sem chamar a IA. Substituiu o antigo GET /api/precise-data (removido): quem precisa só do
  // dado bruto (ex: atualização periódica do mapa) usa só este, sem pagar o custo/risco de uma
  // chamada à MAPI AI a cada poll.
  async getEnvironmentalData(latitude: number, longitude: number): Promise<MapiResponseDTO> {
    const response = await api.get<MapiResponseDTO>('/api/environmental-data', {
      params: { latitude, longitude }
    });
    return response.data;
  },

  // Dado ambiental do ponto/local (o antigo GET /api/precise-data). A previsão do classificador saiu em 21/11/2026;
  // o nível do ponto vem de GET /api/alagamento/pontos.
  async getPreciseData(latitude: number, longitude: number): Promise<MapiResponseDTO> {
    return this.getEnvironmentalData(latitude, longitude);
  },


  // 201 = evento novo criado (corpo presente). 204 = já existia um evento equivalente (mesmo
  // ponto e dia) e foi ignorado — não é erro, só não há nada novo pra retornar.
  async ingestScraperEvent(data: ScraperEventDTO): Promise<FloodEventDTO | null> {
    const response = await api.post<FloodEventDTO | null>('/api/eventos-alagamento/ingest', data);
    return response.status === 204 ? null : response.data;
  },

};

