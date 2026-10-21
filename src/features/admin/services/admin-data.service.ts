import api from '@/lib/api';
import { z } from 'zod';
import { ingestionSourceSchema, userPageSchema, type IngestionSource, type UserPage } from '../schemas/admin.schema';

export const adminDataService = {
  async ingestionSources(): Promise<IngestionSource[]> {
    const { data } = await api.get<unknown>('/api/admin/ingestion/sources');
    return z.array(ingestionSourceSchema).parse(data);
  },
  async users(page = 0, size = 20): Promise<UserPage> {
    const { data } = await api.get<unknown>('/api/admin/users', { params: { page, size } });
    return userPageSchema.parse(data);
  },
};
