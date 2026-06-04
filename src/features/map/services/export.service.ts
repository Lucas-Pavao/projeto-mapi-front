import axios from 'axios';
import { API_URL, getAuthHeader } from './api';
import type { UnifiedDataDTO } from '../types';

export const exportService = {
  async getUnifiedIAData(slug: string, days = 30): Promise<UnifiedDataDTO[]> {
    const response = await axios.get<UnifiedDataDTO[]>(`${API_URL}/api/export/ia-dataset/${slug}`, {
      params: { days },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getUnifiedIADataCsv(slug: string, days = 30): Promise<string> {
    const response = await axios.get<string>(`${API_URL}/api/export/ia-dataset/${slug}/csv`, {
      params: { days },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getAllPointsIADataCsv(days = 0): Promise<string> {
    const response = await axios.get<string>(`${API_URL}/api/export/ia-dataset/all/csv`, {
      params: { days },
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
