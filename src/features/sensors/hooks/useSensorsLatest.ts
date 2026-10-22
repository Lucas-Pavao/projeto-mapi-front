import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SensorType } from '../schemas/sensor.schema';
import { sensorsService } from '../services/sensors.service';

/** Última leitura por sensor, com filtro de tipo. Recarrega a cada minuto (a coleta roda a cada 3 a 15 min). */
export const useSensorsLatest = (type?: SensorType) =>
  useQuery({ queryKey: ['sensors', 'latest', type ?? 'all'], queryFn: () => sensorsService.latest(type), refetchInterval: 60_000, placeholderData: keepPreviousData });
