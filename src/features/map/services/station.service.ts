import api from '@/lib/api';
import { validateMeasuredRain, type MeasuredRain } from '../schemas/measuredRain.schema';

export const stationService = {
  /** Acumulados medidos do Cemaden (1 a 120 h) por estação canônica; 503 enquanto a API não fez a primeira leitura. */
  async getMeasuredRain(): Promise<MeasuredRain> {
    const response = await api.get<unknown>('/api/stations/rain-accumulations');
    return validateMeasuredRain(response.data);
  },
};
