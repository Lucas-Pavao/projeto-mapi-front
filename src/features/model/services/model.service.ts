import api from '@/lib/api';
import { bucketSimulationSchema, modelEvaluationSchema, type BucketInput, type BucketSimulation, type ModelEvaluation } from '../schemas/model.schema';

export type BucketSimulationInput = BucketInput;

export const modelService = {
  /**
   * Avaliação congelada (ADR 0014 e F1). `headerSha256` é o X-Content-SHA256 da resposta, para a tela
   * conferir com o `sha256` do corpo. 503 = arquivo ausente ou hash divergente no servidor.
   */
  async evaluation(): Promise<ModelEvaluation & { headerSha256: string | null }> {
    const res = await api.get<unknown>('/api/model/evaluation');
    const header = res.headers?.['x-content-sha256'];
    return { ...modelEvaluationSchema.parse(res.data), headerSha256: typeof header === 'string' ? header : null };
  },
  async simulateBucket(input: BucketSimulationInput): Promise<BucketSimulation> {
    const { data } = await api.post<unknown>('/api/model/simulate/bucket', input);
    return bucketSimulationSchema.parse(data);
  },
};
