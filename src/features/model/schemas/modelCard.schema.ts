import { z } from 'zod';
import cardJson from '../data/xgb_v2_model_card.json';

const split = z.object({ rows: z.number(), positives: z.number(), from: z.string(), to: z.string() });

/**
 * Cartão do modelo em produção (xgb_v2): JSON estático gerado de projeto-mapi-ai (`reports/model_card.json`, via
 * `python -m mapi_ai.model_card`) e copiado para `data/`. Todo número da tela sai daqui; nada é recalculado.
 */
export const modelCardSchema = z.object({
  modelVersion: z.string(),
  trainingData: z.string(),
  rainSource: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  synthetic: z.object({ n: z.number(), positiveRate: z.number(), seed: z.number() }),
  thresholds: z.object({ medium: z.number(), high: z.number(), criteria: z.object({ high: z.string(), medium: z.string() }).partial().optional() }),
  calibration: z.object({ used: z.boolean(), valEceRaw: z.number().nullable().optional(), criterion: z.string().nullable().optional() }),
  split: z.object({ train: split, validation: split, test: split }).partial().optional(),
  rows: z.array(z.object({ id: z.string(), name: z.string(), prAuc: z.number(), rocAuc: z.number(), brier: z.number() })),
  ablations: z.array(z.object({ label: z.string(), delta: z.number(), lo: z.number(), hi: z.number() })),
  xai: z.object({
    top5: z.array(z.string()), jaccard: z.number(), spearman: z.number(), lime10: z.number(),
    delShap: z.number(), delLime: z.number(), delRandom: z.number(), planBSpearman: z.number(),
  }),
  sources: z.record(z.string(), z.string()).optional(),
  attribution: z.string().nullable().optional(),
});
export type ModelCard = z.infer<typeof modelCardSchema>;

/** Valida o arquivo empacotado. Fora do contrato = null (a tela diz que o cartão está inválido, não inventa número). */
export function loadModelCard(raw: unknown = cardJson): ModelCard | null {
  const r = modelCardSchema.safeParse(raw);
  if (!r.success) console.error('[model-card] xgb_v2_model_card.json fora do contrato:', z.treeifyError(r.error));
  return r.success ? r.data : null;
}
