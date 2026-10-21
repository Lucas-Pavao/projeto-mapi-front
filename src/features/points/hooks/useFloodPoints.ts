import { useQuery } from '@tanstack/react-query';
import { floodService } from '@/features/map/services/flood.service';

export const useFloodPoints = () => useQuery({ queryKey: ['points', 'all'], queryFn: () => floodService.getAllFloodPoints() });
