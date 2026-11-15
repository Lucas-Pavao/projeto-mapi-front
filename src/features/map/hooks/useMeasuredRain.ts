import { useQuery } from '@tanstack/react-query';
import { stationService } from '../services/station.service';

/** A API renova da PED a cada 10 min; reler a cada 5 min pega a renovação sem bater à toa. */
const FIVE_MIN = 300_000;

/** Chuva medida por estação canônica (Cemaden). Só busca com a camada ligada. */
export function useMeasuredRain(enabled: boolean) {
  return useQuery({
    queryKey: ['stations', 'rain-accumulations'],
    queryFn: stationService.getMeasuredRain,
    enabled,
    refetchInterval: FIVE_MIN,
    staleTime: FIVE_MIN,
  });
}
