import api from '@/lib/api';
import { timelineSchema, type Timeline } from '../schemas/timeline.schema';

export const eventsService = {
  async timeline(from: string, to: string, slugs?: string[]): Promise<Timeline> {
    const { data } = await api.get<unknown>('/api/events/timeline', { params: { from, to, slugs: slugs?.join(',') } });
    return timelineSchema.parse(data);
  },
};
