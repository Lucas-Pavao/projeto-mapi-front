import { z } from 'zod';
import raw from '../data/regressao_card.json';

/**
 * Cartão do alerta por regressão (aba padrão da tela Modelo). Gerado dos relatórios da IA por
 * projeto-mapi-ai/scripts/cartao_regressao.py (validacao.json, evaluation.json do rain_v1, balde10_5anos.json).
 */
export const regressaoCardSchema = z.object({
  version: z.string(),
  rule: z.string(),
  pipeline: z.array(z.object({ step: z.string(), kind: z.string(), detail: z.string() })).length(4),
  validation: z.array(z.object({ id: z.string(), item: z.string(), status: z.string(), result: z.string(), ci: z.tuple([z.number(), z.number()]).nullable() })),
  smallSampleNote: z.string(),
  finding: z.string(),
  neverFired: z.boolean(),
  rainWarning: z.array(z.object({ horizonHours: z.number(), events: z.number(), detected: z.number(), leadMedianMin: z.number(), falsePerEvent: z.number(), warnedBeforeRainPct: z.number() })),
  bucket5y: z.array(z.object({ slug: z.string(), noTerrain: z.boolean(), tr2: z.number().optional(), tr5: z.number().optional(), tr10: z.number().optional(), dates: z.array(z.string()).optional() })),
  sources: z.array(z.string()),
  attribution: z.string(),
});
export type RegressaoCard = z.infer<typeof regressaoCardSchema>;

/** Cartão validado; contrato quebrado vira null (a tela mostra estado próprio, nunca números inventados). */
export const loadRegressaoCard = (): RegressaoCard | null => {
  const r = regressaoCardSchema.safeParse(raw);
  return r.success ? r.data : null;
};
