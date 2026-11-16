import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { stationsService } from '../services/stations.service';

const FIVE_MIN = 300_000;

/** Estações canônicas do Cemaden (PED + apelidos ao vivo). */
export const useCanonicalStations = () =>
  useQuery({ queryKey: ['stations', 'canonical'], queryFn: stationsService.canonical, refetchInterval: FIVE_MIN, staleTime: FIVE_MIN });

/** Últimas `hours` h da estação (janela fixada na montagem: chave de cache estável). */
export function useStationHourly(canonicalId: string | null, hours = 24) {
  const [range] = useState(() => {
    const to = new Date();
    return { from: new Date(to.getTime() - hours * 3_600_000).toISOString(), to: to.toISOString() };
  });
  return useQuery({
    queryKey: ['stations', canonicalId, 'hourly', range],
    queryFn: () => stationsService.hourly(canonicalId as string, range.from, range.to),
    enabled: canonicalId != null,
    placeholderData: keepPreviousData,
    refetchInterval: FIVE_MIN,
  });
}
