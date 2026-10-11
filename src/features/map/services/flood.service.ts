import api from '@/lib/api';
import { validateFloodPoint, validateFloodPrediction } from '../schemas/floodPointResponse.schema';
import type {
  FloodPointResponseDTO,
  FloodPointRequestDTO,
  FloodEventDTO,
  ScraperEventDTO,
  MapiResponseDTO,
  FloodScenarioLabelResponseDTO,
  FloodPredictionResponseDTO
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

  // Roda uma nova avaliação de risco de alagamento pra uma coordenada (chama a MAPI AI e grava
  // auditoria em flood_predictions no backend). POST porque não é idempotente nem "seguro" no
  // sentido HTTP — cada chamada cria um novo registro de predição.
  async createFloodPrediction(latitude: number, longitude: number): Promise<FloodPredictionResponseDTO> {
    const response = await api.post<FloodPredictionResponseDTO>('/api/flood-predictions', null, {
      params: { latitude, longitude }
    });
    return validateFloodPrediction(response.data);
  },

  // Conveniência client-side: busca dado ambiental + predição juntos, pro card de detalhe (clique
  // no mapa/sensor) que sempre mostra os dois lado a lado hoje. Substitui o antigo GET
  // /api/precise-data (removido do backend) — a composição que antes acontecia no servidor agora
  // acontece aqui, chamando os dois endpoints dedicados em paralelo. Se a predição falhar (IA
  // fora do ar), o dado ambiental ainda é exibido — só o card de risco fica vazio.
  async getPreciseData(latitude: number, longitude: number): Promise<MapiResponseDTO> {
    const [environmentalData, floodPrediction] = await Promise.all([
      this.getEnvironmentalData(latitude, longitude),
      this.createFloodPrediction(latitude, longitude).catch((error) => {
        console.error('[floodService] Falha ao obter predição de risco:', error);
        return undefined;
      }),
    ]);
    return { ...environmentalData, floodPrediction };
  },

  async reportFlood(data: Partial<FloodEventDTO>): Promise<FloodEventDTO> {
    const response = await api.post<FloodEventDTO>('/api/eventos-alagamento', data);
    return response.data;
  },

  // 201 = evento novo criado (corpo presente). 204 = já existia um evento equivalente (mesmo
  // ponto e dia) e foi ignorado — não é erro, só não há nada novo pra retornar.
  async ingestScraperEvent(data: ScraperEventDTO): Promise<FloodEventDTO | null> {
    const response = await api.post<FloodEventDTO | null>('/api/eventos-alagamento/ingest', data);
    return response.status === 204 ? null : response.data;
  },

  async reportScenario(data: { latitude: number; longitude: number; isFlooded: boolean }): Promise<FloodScenarioLabelResponseDTO> {
    const response = await api.post<FloodScenarioLabelResponseDTO>('/api/pontos/scenarios', data);
    return response.data;
  },
};

