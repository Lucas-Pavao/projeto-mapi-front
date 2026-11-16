import { z } from 'zod';
import cardJson from '../data/v3_model_card.json';

const metrics = z.object({ pr_auc: z.number(), roc_auc: z.number(), brier: z.number(), bss: z.number(), ece: z.number() });
const events = z.object({
  alertDaysPerPointYear: z.number(), eventRecall: z.number(), rainEventRecall: z.number(),
  leadMedianH: z.number().nullable(), leadP10H: z.number().nullable(), falseAlertsPerEvent: z.number(),
});
const expl = z.object({
  jaccard: z.number(), spearman: z.number(), limeStability: z.number(), deletionShap: z.number(), deletionRandom: z.number(),
  formulaRecovery: z.number().nullable().optional(),
});

/**
 * Cartão do modelo v3: JSON estático gerado de projeto-mapi-ai (`reports/v3/model_card.json`, via
 * `python -m mapi_ai.v3.model_card`) e copiado para `data/`. Nada é recalculado na tela.
 */
export const modelCardV3Schema = z.object({
  modelVersion: z.string(),
  model: z.string(),
  horizonHours: z.number(),
  tag: z.string(),
  trainingData: z.string(),
  features: z.array(z.string()),
  removedFromV2: z.array(z.string()),
  selectionCriterion: z.string(),
  thresholds: z.object({ medium: z.number(), high: z.number(), rule: z.string(), probability: z.string() }),
  calibration: z.object({ adopted: z.boolean(), check: z.object({ raw: z.object({ ece: z.number(), brier: z.number() }), calibrated: z.object({ ece: z.number(), brier: z.number() }) }) }),
  prior: z.object({ piReal: z.number(), piSint: z.number(), source: z.string() }),
  horizons: z.array(z.object({
    hours: z.number(), model: z.string(), validation: z.record(z.string(), z.number()),
    test: metrics.nullable(), testComplete: metrics.nullable(), testCalibrated: metrics.nullable(),
    events: z.object({ medium: events, high: events }),
  })),
  explanations: z.record(z.string(), expl),
  physical: z.record(z.string(), z.object({ testPrAuc: z.number(), soilAbsentPrAuc: z.number().nullable().optional() })),
  attribution: z.string().nullable().optional(),
});
export type ModelCardV3 = z.infer<typeof modelCardV3Schema>;

export function loadModelCardV3(raw: unknown = cardJson): ModelCardV3 | null {
  const r = modelCardV3Schema.safeParse(raw);
  if (!r.success) console.error('[model-card] v3_model_card.json fora do contrato:', z.treeifyError(r.error));
  return r.success ? r.data : null;
}
