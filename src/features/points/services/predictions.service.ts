import api from '@/lib/api';
import { predictionSeriesSchema, type PredictionSeries } from '../schemas/prediction.schema';

export const predictionsService = {
  async series(slug: string, from: string, to: string): Promise<PredictionSeries> {
    const { data } = await api.get<unknown>(`/api/pontos/${encodeURIComponent(slug)}/predictions`, { params: { from, to } });
    return predictionSeriesSchema.parse(data);
  },
};
