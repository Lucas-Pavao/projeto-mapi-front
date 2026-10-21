import api from '@/lib/api';
import { bucketSimulationSchema, modelEvaluationSchema, type BucketSimulation, type ModelEvaluation } from '../schemas/model.schema';

export interface BucketSimulationInput {
  slug: string;
  rainfallMmH: number[];
  f?: 0 | 0.2 | 0.4 | 0.6 | 0.8 | 1;
  curveScale?: number;
}

export const modelService = {
  async evaluation(): Promise<ModelEvaluation> {
    const { data } = await api.get<unknown>('/api/model/evaluation');
    return modelEvaluationSchema.parse(data);
  },
  async simulateBucket(input: BucketSimulationInput): Promise<BucketSimulation> {
    const { data } = await api.post<unknown>('/api/model/simulate/bucket', input);
    return bucketSimulationSchema.parse(data);
  },
};
