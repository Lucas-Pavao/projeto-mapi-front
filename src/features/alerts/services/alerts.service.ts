import api from '@/lib/api';
import type { Alert, PageMeta } from '@/types/api';

export type AlertStatusFilter = 'OPEN' | 'ACKNOWLEDGED' | 'ALL';

export const alertsService = {
  async list(status: AlertStatusFilter = 'OPEN', page = 0, size = 20): Promise<PageMeta<Alert>> {
    const { data } = await api.get<PageMeta<Alert>>('/api/alerts', { params: { status, page, size } });
    return data;
  },
};
