import { useQuery } from '@tanstack/react-query';
import { loadRainData } from '../services/rain-data.service';

/** Dados estáticos: nunca ficam velhos dentro da sessão. */
export const useRainData = () => useQuery({ queryKey: ['rain-events', 'static'], queryFn: loadRainData, staleTime: Infinity, gcTime: Infinity });
