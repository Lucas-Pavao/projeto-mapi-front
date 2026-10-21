import api from '@/lib/api';
import type { Timeline } from '@/types/api';

export const eventsService = {
  async timeline(from: string, to: string, slugs?: string[]): Promise<Timeline> {
    const { data } = await api.get<Timeline>('/api/events/timeline', { params: { from, to, slugs: slugs?.join(',') } });
    return data;
  },
};
