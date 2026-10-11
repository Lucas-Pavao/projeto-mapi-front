import api from '@/lib/api';
import type { DataHealthReportDTO, TideSyncSummaryDTO, IngestionAcceptedDTO } from '../types';

export const adminService = {
  async checkDataIntegrity(): Promise<DataHealthReportDTO[]> {
    const response = await api.get<DataHealthReportDTO[]>('/api/admin/ingestion/check-integrity');
    return response.data;
  },

  // 202 Accepted: o job roda em background, ainda não terminou quando a resposta chega.
  async startFullSync(years = 5): Promise<IngestionAcceptedDTO> {
    const response = await api.post<IngestionAcceptedDTO>(`/api/admin/ingestion/historical-full-sync?years=${years}`);
    return response.data;
  },

  // Síncrono no backend (200 OK) — já terminou quando a resposta chega.
  async alignEvents(): Promise<IngestionAcceptedDTO> {
    const response = await api.post<IngestionAcceptedDTO>('/api/admin/ingestion/align-events');
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
