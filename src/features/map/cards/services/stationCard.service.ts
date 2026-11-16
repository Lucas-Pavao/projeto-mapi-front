import api from '@/lib/api';
import { stationCardSchema, type StationCardData } from '../schemas/stationCard.schema';

export const stationCardService = {
  /** Card do pluviômetro (B6). `at` = instante de referência em UTC; sem ele, agora. 404 se a canônica não existe. */
  async get(canonicalId: string, at?: string): Promise<StationCardData> {
    const { data } = await api.get<unknown>(`/api/stations/${encodeURIComponent(canonicalId)}/card`, { params: at ? { at } : undefined });
    return stationCardSchema.parse(data);
  },
};
