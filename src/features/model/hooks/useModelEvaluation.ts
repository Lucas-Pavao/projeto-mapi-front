import { useQuery } from '@tanstack/react-query';
import { httpStatus } from '@/lib/apiError';
import { modelService } from '../services/model.service';

/** Avaliação congelada: nunca muda, então não recarrega. 503 não é repetido. */
export const useModelEvaluation = () =>
  useQuery({
    queryKey: ['model', 'evaluation'],
    queryFn: modelService.evaluation,
    staleTime: Infinity,
    retry: (count, error) => httpStatus(error) !== 503 && count < 1,
  });
