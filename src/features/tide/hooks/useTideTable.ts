import { useQuery } from '@tanstack/react-query';
import { tideService } from '@/features/map/services/tide.service';

/** Tábua do porto de referência (pe02) para o ano: dias com preamares e baixa-mares. Muda 1× por dia. */
export const useTideTable = (harbor: string, year: number) =>
  useQuery({ queryKey: ['tide', 'table', harbor, year], queryFn: () => tideService.getTideTable(harbor, year), staleTime: 60 * 60_000 });
