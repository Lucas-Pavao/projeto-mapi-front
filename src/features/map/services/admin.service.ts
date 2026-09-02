import api from '@/lib/api';
import type { DataHealthReportDTO, TideSyncSummaryDTO } from '../types';

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

  /** Sincroniza a tábua de maré local (fonte DHN, via TabuaMare) para os portos mais próximos
   * de todos os pontos cadastrados. Ver TideTableSyncService no backend. */
  async syncTideTables(year?: number): Promise<TideSyncSummaryDTO> {
    const response = await api.post<TideSyncSummaryDTO>('/api/admin/ingestion/tide-sync', null, {
      params: { year },
    });
    return response.data;
  },
};
