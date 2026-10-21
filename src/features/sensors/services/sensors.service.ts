import api from '@/lib/api';
import type { SensorFreshness, SensorType } from '@/types/api';

export const sensorsService = {
  async latest(type?: SensorType): Promise<SensorFreshness[]> {
    const { data } = await api.get<SensorFreshness[]>('/api/sensors/latest', { params: { type } });
    return data;
  },
};
