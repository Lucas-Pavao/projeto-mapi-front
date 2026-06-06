import api from '@/lib/api';
import type { SensorResponseDTO } from '../types';

export const sensorService = {
  async getLatestSensors(): Promise<SensorResponseDTO[]> {
    const response = await api.get<SensorResponseDTO[]>('/api/sensors/latest');
    return response.data;
  },

  async getLatestBySensorId(sensorId: string): Promise<SensorResponseDTO> {
    const response = await api.get<SensorResponseDTO>(`/api/sensors/${sensorId}/latest`);
    return response.data;
  },
};
