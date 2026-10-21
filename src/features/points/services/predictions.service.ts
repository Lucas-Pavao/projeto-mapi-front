import api from '@/lib/api';
import { predictionSeriesSchema, riskSummarySchema, type PredictionSeries, type RiskSummary } from '../schemas/prediction.schema';

export const predictionsService = {
  async series(slug: string, from: string, to: string): Promise<PredictionSeries> {
    const { data } = await api.get<unknown>(`/api/pontos/${encodeURIComponent(slug)}/predictions`, { params: { from, to } });
    return predictionSeriesSchema.parse(data);
  },
  /** Contagem de pontos ativos por nível de risco (última previsão de cada ponto). */
  async riskSummary(): Promise<RiskSummary> {
    const { data } = await api.get<unknown>('/api/pontos/risk-summary');
    return riskSummarySchema.parse(data);
  },
};
