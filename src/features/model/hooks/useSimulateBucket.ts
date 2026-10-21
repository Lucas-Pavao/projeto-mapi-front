import { useMutation } from '@tanstack/react-query';
import { modelService, type BucketSimulationInput } from '../services/model.service';

/** Simulação do balde M1a (ADR 0014). Não grava nada e não é previsão. */
export const useSimulateBucket = () => useMutation({ mutationFn: (input: BucketSimulationInput) => modelService.simulateBucket(input) });
