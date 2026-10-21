import api from '@/lib/api';
import type { PredictionSummary } from '@/types/api';

export interface PredictionSeries {
  slug: string;
  from: string;
  to: string;
  items: PredictionSummary[];
}

export const predictionsService = {
  async series(slug: string, from: string, to: string): Promise<PredictionSeries> {
    const { data } = await api.get<PredictionSeries>(`/api/pontos/${encodeURIComponent(slug)}/predictions`, { params: { from, to } });
    return data;
  },
};
