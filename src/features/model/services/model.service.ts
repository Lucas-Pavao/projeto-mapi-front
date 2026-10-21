import api from '@/lib/api';
import type { BucketSimulation, ModelEvaluation } from '@/types/api';

export interface BucketSimulationInput {
  slug: string;
  rainfallMmH: number[];
  f?: 0 | 0.2 | 0.4 | 0.6 | 0.8 | 1;
  curveScale?: number;
}

export const modelService = {
  async evaluation(): Promise<ModelEvaluation> {
    const { data } = await api.get<ModelEvaluation>('/api/model/evaluation');
    return data;
  },
  async simulateBucket(input: BucketSimulationInput): Promise<BucketSimulation> {
    const { data } = await api.post<BucketSimulation>('/api/model/simulate/bucket', input);
    return data;
  },
};
