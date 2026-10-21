import { useQuery } from '@tanstack/react-query';
import { floodService } from '@/features/map/services/flood.service';
import { httpStatus } from '@/lib/apiError';

/** Ponto crítico por slug (GET /api/pontos/{slug}). 404 não é repetido. */
export const usePoint = (slug: string) =>
  useQuery({
    queryKey: ['points', slug],
    queryFn: () => floodService.getPointStatus(slug),
    enabled: slug !== '',
    retry: (count, error) => httpStatus(error) !== 404 && count < 1,
  });
