import { useQuery } from '@tanstack/react-query';
import { locationAnalysisService } from '../services/locationAnalysis.service';

/** Cache de 10 min por célula de ~200 m: a chave arredonda a coordenada em 3 casas (~110 m). */
export const useLocationAnalysis = (coords: { lat: number; lon: number } | null) =>
  useQuery({
    queryKey: ['locations', 'analysis', coords ? coords.lat.toFixed(3) : null, coords ? coords.lon.toFixed(3) : null],
    queryFn: () => locationAnalysisService.get((coords as { lat: number; lon: number }).lat, (coords as { lat: number; lon: number }).lon),
    enabled: coords != null,
    staleTime: 600_000,
  });
