import axios from 'axios';
import { API_URL, getAuthHeader } from './api';
import type { SensorResponseDTO } from '../types';

export const sensorService = {
  async getLatestSensors(): Promise<SensorResponseDTO[]> {
    const response = await axios.get<SensorResponseDTO[]>(`${API_URL}/api/sensors/latest`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getLatestBySensorId(sensorId: string): Promise<SensorResponseDTO> {
    const response = await axios.get<SensorResponseDTO>(`${API_URL}/api/sensors/${sensorId}/latest`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
