import { useQuery } from '@tanstack/react-query';
import { measuredRainService } from '../services/measured-rain.service';

/** Chuva medida acumulada do ponto; renova a cada 10 min (a série do ponto fecha de hora em hora). */
export const useMeasuredRain = (slug: string) =>
  useQuery({ queryKey: ['points', slug, 'chuva-medida'], queryFn: () => measuredRainService.get(slug), enabled: slug !== '',
    refetchInterval: 600_000, staleTime: 300_000, retry: false });
