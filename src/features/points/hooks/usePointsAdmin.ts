import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FloodPointRequestDTO } from '@/features/map/types';
import { pointsAdminService } from '../services/points-admin.service';
import type { FloodPointPatch } from '../schemas/point-admin.schema';

export function usePatchPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, body }: { slug: string; body: FloodPointPatch }) => pointsAdminService.patch(slug, body),
    onSettled: () => qc.invalidateQueries({ queryKey: ['points'] }),
  });
}

export function useCreatePoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FloodPointRequestDTO) => pointsAdminService.create(body),
    onSettled: () => qc.invalidateQueries({ queryKey: ['points'] }),
  });
}

/** Sugestões de estação para uma coordenada; só consulta quando `enabled` (clique do ADMIN). */
export const useStationSuggestions = (lat: number | null, lon: number | null, enabled: boolean) =>
  useQuery({
    queryKey: ['points', 'station-suggestions', lat, lon],
    queryFn: () => pointsAdminService.stationSuggestions(lat as number, lon as number),
    enabled: enabled && lat != null && lon != null,
  });
