import { useQuery } from '@tanstack/react-query';
import { publicRiskService } from '../services/public-risk.service';
import { httpStatus } from '@/lib/apiError';
import { roundCoord } from '../utils/coords';

export interface Coord {
  lat: number;
  lon: number;
}

/**
 * Risco perto de uma coordenada (ADR 0013). A coordenada é arredondada a 3 casas antes de entrar na
 * chave e na requisição. 422 (fora da RMR) e 429 (limite de taxa) não são repetidos; sem refetch ao focar.
 */
export const usePublicRisk = (coord: Coord | null) => {
  const c = coord ? { lat: roundCoord(coord.lat), lon: roundCoord(coord.lon) } : null;
  return useQuery({
    queryKey: ['public', 'risk', c],
    queryFn: () => publicRiskService.nearby(c!.lat, c!.lon),
    enabled: c !== null,
    retry: (count, error) => ![422, 429].includes(httpStatus(error) ?? 0) && count < 1,
    gcTime: 60_000,
  });
};
