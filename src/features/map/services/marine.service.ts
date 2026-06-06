import api from '@/lib/api';

export const marineService = {
  async getMarineData(latitude: number, longitude: number): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>('/api/marine', {
      params: { latitude, longitude }
    });
    return response.data;
  },

  async getWaveHeight(latitude: number, longitude: number): Promise<number> {
    const response = await api.get<number>('/api/marine/wave-height', {
      params: { latitude, longitude }
    });
    return response.data;
  },
};
