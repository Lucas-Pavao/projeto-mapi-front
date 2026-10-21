import api from '@/lib/api';
import type { IngestionSource, PageMeta, UserSummary } from '@/types/api';

export const adminDataService = {
  async ingestionSources(): Promise<IngestionSource[]> {
    const { data } = await api.get<IngestionSource[]>('/api/admin/ingestion/sources');
    return data;
  },
  async users(page = 0, size = 20): Promise<PageMeta<UserSummary>> {
    const { data } = await api.get<PageMeta<UserSummary>>('/api/admin/users', { params: { page, size } });
    return data;
  },
};
