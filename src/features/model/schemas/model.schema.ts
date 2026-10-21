import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

export const modelEvaluationSchema = z.object({
  sha256: z.string(),
  source: z.string(),
  frozenAt: isoSchema.nullable().optional(),
  result: z.record(z.string(), z.unknown()),
});
export type ModelEvaluation = z.infer<typeof modelEvaluationSchema>;

export const bucketSimulationSchema = z.object({
  model: z.literal('M1a'),
  illustrative: z.literal(true),
  hMm: z.array(z.number()),
  hmaxMm: z.number(),
  tCrossH: z.number().nullable().optional(),
  nOutsideCurve: z.number(),
  paramsUsed: z.object({
    C: z.number(),
    iT_mm_h: z.number(),
    f: z.number(),
    hcrit_mm: z.number(),
    snap_m: z.number(),
    curve_scale: z.number(),
  }),
});
export type BucketSimulation = z.infer<typeof bucketSimulationSchema>;

/**
 * Estrutura de `result` (conteúdo literal de avaliacao-f1/resultado_etapa2.json). Só descreve o
 * formato para leitura; nenhum número é calculado nem preenchido aqui. Campo ausente = não exibido.
 */
const ci = z.tuple([z.number(), z.number()]);
const aucWithCi = z.tuple([z.number(), ci]);
const m1Entry = z
  .object({
    auc: z.number(), auc_ic: ci, d_h1: z.number(), d_h1_ic: ci, cat_h1: z.string(), d_h2: z.number(), d_h2_ic: ci, cat_h2: z.string(),
  })
  .partial()
  .passthrough();
const aucEntry = z.object({ auc: z.number(), ic: ci, exclui_05: z.boolean(), auc18: z.number(), ic18: ci }).partial().passthrough();
const binEntry = z.object({ k14: z.number(), ic14: ci, k18: z.number(), ic18: ci, k4: z.number(), kn: z.number(), icn: ci }).partial().passthrough();

export const evaluationResultSchema = z
  .object({
    n_pos_principal: z.number(),
    n_pos_extra: z.number(),
    n_neg_bruto: z.number(),
    n_neg: z.number(),
    episodios_principal: z.number(),
    episodios_18: z.number(),
    dias_incompletos_avaliacao: z.array(z.unknown()),
    auc_B2: aucWithCi,
    auc_B3: aucWithCi,
    m1: z.record(z.string(), m1Entry),
    class_h1: z.tuple([z.string(), z.array(z.unknown())]),
    class_h2: z.tuple([z.string(), z.array(z.unknown())]),
    degenerado: z.object({ alerta_M1a_em_N: z.number(), S_zero_em_todos_positivos: z.boolean(), S_max_N: z.number() }).partial().passthrough(),
    auc_todos: z.record(z.string(), aucEntry),
    binarias: z.record(z.string(), binEntry),
  })
  .partial()
  .passthrough();
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

/** Lê `result` sem lançar: formato diferente do esperado vira `null` (a tela mostra o JSON como veio). */
export function parseEvaluationResult(result: Record<string, unknown>): EvaluationResult | null {
  const r = evaluationResultSchema.safeParse(result);
  return r.success ? r.data : null;
}
