import { useQuery } from '@tanstack/react-query';
import { rainCandidatesService } from '../services/rain-candidates.service';

export const useRainCandidates = (slug: string) =>
  useQuery({ queryKey: ['points', slug, 'rain-candidates'], queryFn: () => rainCandidatesService.get(slug), enabled: slug !== '' });
