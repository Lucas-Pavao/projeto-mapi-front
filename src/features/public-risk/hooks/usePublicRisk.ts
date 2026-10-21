import { useQuery } from '@tanstack/react-query';
import { publicRiskService } from '../services/public-risk.service';

export interface Coord {
  lat: number;
  lon: number;
}

export const usePublicRisk = (coord: Coord | null) =>
  useQuery({
    queryKey: ['public', 'risk', coord],
    queryFn: () => publicRiskService.nearby(coord!.lat, coord!.lon),
    enabled: coord !== null,
  });
