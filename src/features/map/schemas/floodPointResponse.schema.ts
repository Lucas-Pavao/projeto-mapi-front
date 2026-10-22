import { z } from 'zod';

/**
 * Validação de runtime pro contrato mais crítico do app: `/api/pontos` alimenta o mapa
 * inteiro. Um type TS só protege em tempo de compilação — se o backend mudar um shape de
 * resposta (já aconteceu antes: `flood_probability`/`risk_level` chegando em snake_case
 * enquanto o tipo dizia camelCase — corrigido no backend, mas o guard fica como defesa contra
 * a próxima vez), nada aqui te avisa, os campos só viram `undefined` em silêncio. Isso valida o
 * formato mínimo esperado e reporta claramente no console quando o contrato real diverge do que
 * o código espera, em vez de deixar o mapa quebrar sem explicação.
 *
 * Deliberadamente não é `.strict()`: o objetivo é pegar campos ESSENCIAIS ausentes/com tipo
 * errado, não rejeitar a resposta inteira porque o backend adicionou um campo novo.
 */
export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'] as const;
export const DEGRADATION_REASONS = [
  'INSUFFICIENT_DATA',
  'AI_TIMEOUT',
  'AI_UNAVAILABLE',
  'AI_ERROR',
] as const;

/**
 * ADR 0007 §1 e passo 1 da implantação: enum fechado, mas tolerante. Valor fora do enum
 * (ex.: 'CRITICAL'/'EXTREME' do backend antigo) vira 'UNKNOWN' e registra console.warn com o
 * valor recebido, para a coerção não esconder um bug. Remover o `.catch` ao fim da Fase 4.
 */
export const riskLevelSchema = z.enum(RISK_LEVELS).catch((ctx) => {
  console.warn('[floodPrediction] riskLevel fora do contrato, tratado como UNKNOWN:', ctx.value);
  return 'UNKNOWN';
});

export const MODEL_VALIDATION_STATUSES = ['NOT_VALIDATED', 'VALIDATED'] as const;

/** ADR 0007 emenda 1 (RC-03): ausente ou valor desconhecido = NOT_VALIDATED (nunca presume validação). */
export const modelValidationStatusSchema = z.enum(MODEL_VALIDATION_STATUSES).optional().catch('NOT_VALIDATED');

export const degradationReasonSchema = z.enum(DEGRADATION_REASONS);

const floodPredictionSchema = z
  .object({
    riskLevel: riskLevelSchema,
    floodProbability: z.number().nullable(),
    estimatedTimeToEvent: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    modelValidationStatus: modelValidationStatusSchema,
    modelVersion: z.string().nullable().optional(),
    issuedAt: z.string().nullable().optional(),
    horizonHours: z.number().nullable().optional(),
    validUntil: z.string().nullable().optional(),
    degradationReason: degradationReasonSchema.nullable().optional(),
    lastValidIssuedAt: z.string().nullable().optional(),
    contributors: z
      .array(z.object({ featureId: z.string(), label: z.string(), contribution: z.number() }))
      .optional(),
    imputedFeatures: z.array(z.object({ featureId: z.string(), label: z.string() })).optional(),
  })
  .passthrough();

export { floodPredictionSchema };
export type FloodPrediction = z.infer<typeof floodPredictionSchema>;
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type ModelValidationStatus = (typeof MODEL_VALIDATION_STATUSES)[number];
export type DegradationReason = (typeof DEGRADATION_REASONS)[number];

const preciseDataSchema = z
  .object({
    source: z.string(),
    timestamp: z.string(),
    precipitation: z.number().nullable(),
    temperature: z.number().nullable(),
    tideHeight: z.number().nullable(),
  })
  .passthrough();

export const floodPointResponseSchema = z
  .object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    active: z.boolean(),
    liveData: preciseDataSchema.nullable().optional(),
    floodPrediction: floodPredictionSchema.nullable().optional(),
  })
  .passthrough();

/**
 * Valida um ponto crítico vindo da API. Em caso de divergência de contrato, loga um erro
 * detalhado e devolve o dado como veio (sem lançar, para não travar o mapa). Em caso de
 * sucesso devolve o resultado do parse (F1-F2-02), com `riskLevel` já normalizado.
 */
export function validateFloodPoint<T>(raw: T): T {
  const result = floodPointResponseSchema.safeParse(raw);
  if (!result.success) {
    console.error(
      '[floodService] Resposta de /api/pontos não bate com o contrato esperado:',
      z.treeifyError(result.error),
      'payload recebido:',
      raw,
    );
    return raw;
  }
  // passthrough preserva os campos não declarados, então o parse é um superconjunto de T.
  return result.data as unknown as T;
}

/** Valida a resposta de POST /api/flood-predictions; em divergência loga e devolve o bruto. */
export function validateFloodPrediction<T>(raw: T): T {
  const result = floodPredictionSchema.safeParse(raw);
  if (!result.success) {
    console.error(
      '[floodService] Predição não bate com o contrato esperado:',
      z.treeifyError(result.error),
      'payload recebido:',
      raw,
    );
    return raw;
  }
  return result.data as unknown as T;
}
