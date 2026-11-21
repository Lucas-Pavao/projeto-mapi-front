import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

/**
 * GET /api/alagamento/pontos e SSE `flood-forecast` (projeto-mapi-api, V38): alerta de alagamento por regressão.
 * ALERTA: a lâmina provável (q50) chega a 15 cm; ATENCAO: só a pessimista (q95); SEM_DADO sempre com motivo.
 */
export const floodLevelSchema = z.enum(['ALERTA', 'ATENCAO', 'SEM_ALERTA', 'SEM_DADO']);
export const floodReasonSchema = z.enum(['CHUVA_AUSENTE', 'PREVISAO_INDISPONIVEL', 'SEM_TERRENO', 'TERRENO_EM_REVISAO', 'SERIE_INCOMPLETA']);

const num = z.number().nullable().optional();

export const floodHorizonSchema = z.object({
  hours: z.number().int(),
  level: floodLevelSchema,
  rainQ50Mm: num,
  rainQ95Mm: num,
  sheetQ50Cm: num,
  sheetQ95Cm: num,
  validUntil: isoSchema.nullable().optional(),
});

export const floodStepSchema = z.object({
  t: isoSchema.nullable().optional(),
  minutesFromNow: z.number().int(),
  kind: z.enum(['medido', 'previsto']),
  rainMm: num,
  inflowM3H: num,
  outflowM3H: num,
  volumeM3: num,
  sheetCm: num,
});

export const floodExplanationSchema = z.object({
  servedScenario: z.enum(['q50', 'q95']).nullable().optional(),
  servedHorizonHours: z.number().int().nullable().optional(),
  shapTop3: z.array(z.object({ text: z.string(), contributionMm: num })),
  counterfactualMm: num,
  counterfactualText: z.string().nullable().optional(),
  sensitivity: z.object({
    minCm: num, maxCm: num, levelChanges: z.boolean(), heaviestParameter: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
  }).nullable().optional(),
  decomposition: z.array(floodStepSchema),
  capacityM3H: num,
});

export const alagamentoPontoSchema = z.object({
  floodPointId: z.number(),
  slug: z.string(),
  name: z.string().nullable().optional(),
  level: floodLevelSchema,
  worstHorizonHours: z.number().int().nullable().optional(),
  reason: floodReasonSchema.nullable().optional(),
  reasonText: z.string().nullable().optional(),
  hNowCm: num,
  rainLastHourMm: num,
  horizons: z.array(floodHorizonSchema),
  explanation: floodExplanationSchema.nullable().optional(),
  rainStation: z.string().nullable().optional(),
  rainStationName: z.string().nullable().optional(),
  rainStationDistanceKm: num,
  latestReadingAgeMinutes: num,
  modelVersions: z.record(z.string(), z.string().nullable()),
  sources: z.array(z.string()).default([]),
  missingInputs: z.array(z.string()).default([]),
  codeVersion: z.string().nullable().optional(),
  issuedAt: isoSchema.nullable().optional(),
  evaluatedAt: isoSchema.nullable().optional(),
  experimental: z.boolean(),
  shadow: z.boolean(),
  rule: z.string(),
  attribution: z.string(),
});

export const alagamentoPontosSchema = z.array(alagamentoPontoSchema);

export type FloodLevel = z.infer<typeof floodLevelSchema>;
export type FloodReason = z.infer<typeof floodReasonSchema>;
export type FloodHorizon = z.infer<typeof floodHorizonSchema>;
export type AlagamentoPonto = z.infer<typeof alagamentoPontoSchema>;
