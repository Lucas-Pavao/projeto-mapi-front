import api from '@/lib/api';
import { rainCandidatesSchema, type RainCandidates } from '../schemas/rain-candidates.schema';

export const rainCandidatesService = {
  /** Candidatas da chuva do ponto (B3). `at` = fim da hora em UTC; sem ele, a última hora com série. */
  async get(slug: string, at?: string): Promise<RainCandidates> {
    const { data } = await api.get<unknown>(`/api/pontos/${encodeURIComponent(slug)}/rain-candidates`, { params: at ? { at } : undefined });
    return rainCandidatesSchema.parse(data);
  },
};
