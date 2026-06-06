import api from '@/lib/api';
import type { UnifiedDataDTO } from '../types';

export const exportService = {
  async getUnifiedIAData(slug: string, days = 30): Promise<UnifiedDataDTO[]> {
    const response = await api.get<UnifiedDataDTO[]>(`/api/export/ia-dataset/${slug}`, {
      params: { days }
    });
    return response.data;
  },

  async getUnifiedIADataCsv(slug: string, days = 30): Promise<string> {
    const response = await api.get<string>(`/api/export/ia-dataset/${slug}/csv`, {
      params: { days }
    });
    return response.data;
  },

  async getAllPointsIADataCsv(days = 0): Promise<string> {
    const response = await api.get<string>('/api/export/ia-dataset/all/csv', {
      params: { days }
    });
    return response.data;
  },
};
