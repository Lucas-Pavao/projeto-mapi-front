import { useQuery } from '@tanstack/react-query';
import type { SensorType } from '@/types/api';
import { sensorsService } from '../services/sensors.service';

export const useSensorsLatest = (type?: SensorType) =>
  useQuery({ queryKey: ['sensors', 'latest', type ?? 'all'], queryFn: () => sensorsService.latest(type) });
