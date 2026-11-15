import api from '@/lib/api';
import { rainEventTableSchema, rainSummarySchema, type RainEventTable, type RainSource, type RainSummary } from '../schemas/rain-events.schema';

export interface RainQuery { slug: string; source: RainSource; from: string; to: string }

const params = (q: RainQuery) => ({ slug: q.slug, source: q.source, from: q.from, to: q.to, format: 'json' });

export const rainEventsService = {
  async events(q: RainQuery): Promise<RainEventTable> {
    const { data } = await api.get<unknown>('/api/analise/eventos-chuva', { params: params(q) });
    return rainEventTableSchema.parse(data);
  },
  async summary(q: RainQuery): Promise<RainSummary> {
    const { data } = await api.get<unknown>('/api/analise/eventos-chuva/resumo', { params: params(q) });
    return rainSummarySchema.parse(data);
  },
};
