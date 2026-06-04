import axios from 'axios';
import { API_URL, getAuthHeader } from './api';
import type { DataHealthReportDTO } from '../types';

export const adminService = {
  async checkDataIntegrity(): Promise<DataHealthReportDTO[]> {
    const response = await axios.get<DataHealthReportDTO[]>(`${API_URL}/api/admin/ingestion/check-integrity`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async repairStations(): Promise<string> {
    const response = await axios.post<string>(`${API_URL}/api/admin/ingestion/repair-stations`, null, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async startFullSync(years = 5): Promise<string> {
    const response = await axios.post<string>(`${API_URL}/api/admin/ingestion/historical-full-sync`, null, {
      params: { years },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async wipeDatabase(): Promise<string> {
    const response = await axios.delete<string>(`${API_URL}/api/admin/ingestion/wipe-database`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async alignEvents(): Promise<string> {
    const response = await axios.post<string>(`${API_URL}/api/admin/ingestion/align-events`, null, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
