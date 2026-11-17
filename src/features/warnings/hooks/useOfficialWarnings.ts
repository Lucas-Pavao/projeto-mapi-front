import { useQuery } from '@tanstack/react-query';
import { officialWarningsService } from '../services/officialWarnings.service';

/** Consulta avisos oficiais vigentes do INMET (a API sincroniza a cada 10 min). */
export const useOfficialWarnings = (municipio?: string) =>
  useQuery({
    queryKey: ['warnings', 'official', 'active', municipio ?? 'all'],
    queryFn: () => officialWarningsService.getActive(municipio),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });
