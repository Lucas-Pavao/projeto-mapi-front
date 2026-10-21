import api from '@/lib/api';
import { z } from 'zod';
import { sensorFreshnessSchema, type SensorFreshness, type SensorType } from '../schemas/sensor.schema';

export const sensorsService = {
  async latest(type?: SensorType): Promise<SensorFreshness[]> {
    const { data } = await api.get<unknown>('/api/sensors/latest', { params: { type } });
    return z.array(sensorFreshnessSchema).parse(data);
  },
};
