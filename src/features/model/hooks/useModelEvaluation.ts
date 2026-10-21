import { useQuery } from '@tanstack/react-query';
import { modelService } from '../services/model.service';

export const useModelEvaluation = () => useQuery({ queryKey: ['model', 'evaluation'], queryFn: modelService.evaluation, staleTime: Infinity });
