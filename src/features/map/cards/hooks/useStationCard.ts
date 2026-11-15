import { useQuery } from '@tanstack/react-query';
import { stationCardService } from '../services/stationCard.service';

const ONE_MIN = 60_000;

export const useStationCard = (canonicalId: string | null) =>
  useQuery({
    queryKey: ['stations', canonicalId, 'card'],
    queryFn: () => stationCardService.get(canonicalId as string),
    enabled: canonicalId != null,
    refetchInterval: ONE_MIN,
  });
