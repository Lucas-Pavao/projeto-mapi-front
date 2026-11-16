import { useQuery } from '@tanstack/react-query';
import { modelService } from '../services/model.service';

/** A conferência roda uma vez por dia: 10 min de cache bastam. */
export const useRainForecastAccuracy = (days = 30) =>
  useQuery({
    queryKey: ['model', 'rain-forecast-accuracy', days],
    queryFn: () => modelService.rainForecastAccuracy(days),
    staleTime: 10 * 60 * 1000,
  });
