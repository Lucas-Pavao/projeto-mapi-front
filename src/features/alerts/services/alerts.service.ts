import api from '@/lib/api';
import { alertPageSchema, type AlertPage } from '../schemas/alert.schema';

export type AlertStatusFilter = 'OPEN' | 'ACKNOWLEDGED' | 'ALL';

export const alertsService = {
  async list(status: AlertStatusFilter = 'OPEN', page = 0, size = 20): Promise<AlertPage> {
    const { data } = await api.get<unknown>('/api/alerts', { params: { status, page, size } });
    return alertPageSchema.parse(data);
  },
};
