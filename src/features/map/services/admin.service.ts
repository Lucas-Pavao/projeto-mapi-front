import api from '@/lib/api';
import type { DataHealthReportDTO } from '../types';

export const adminService = {
  async checkDataIntegrity(): Promise<DataHealthReportDTO[]> {
    const response = await api.get<DataHealthReportDTO[]>('/api/admin/ingestion/check-integrity');
    return response.data;
  },

  async startFullSync(years = 5): Promise<string> {
    const response = await api.post<string>(`/api/admin/ingestion/historical-full-sync?years=${years}`);
    return response.data;
  },

  async alignEvents(): Promise<string> {
    const response = await api.post<string>('/api/admin/ingestion/align-events');
    return response.data;
  },
};
