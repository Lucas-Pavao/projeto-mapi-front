import axios from 'axios';
import { API_URL, getAuthHeader } from './api';

export const marineService = {
  async getMarineData(latitude: number, longitude: number): Promise<Record<string, unknown>> {
    const response = await axios.get<Record<string, unknown>>(`${API_URL}/api/marine`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getWaveHeight(latitude: number, longitude: number): Promise<number> {
    const response = await axios.get<number>(`${API_URL}/api/marine/wave-height`, {
      params: { latitude, longitude },
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
