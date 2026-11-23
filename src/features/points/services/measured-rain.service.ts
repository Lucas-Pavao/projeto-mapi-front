import api from '@/lib/api';
import { measuredRainSchema, type MeasuredRain } from '../schemas/measured-rain.schema';

export const measuredRainService = {
  /** Chuva medida acumulada (1, 3, 6 e 24 h) do ponto; 404 = ponto sem série medida. */
  async get(slug: string): Promise<MeasuredRain> {
    const { data } = await api.get<unknown>(`/api/pontos/${encodeURIComponent(slug)}/chuva-medida`);
    return measuredRainSchema.parse(data);
  },
};
