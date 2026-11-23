import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

/**
 * GET /api/alagamento/pontos e SSE `flood-forecast` (projeto-mapi-api, V38): alerta de alagamento por regressão.
 * ALERTA: a lâmina provável (q50) chega a 15 cm; ATENCAO: só a pessimista (q95); SEM_DADO sempre com motivo.
 */
export const floodLevelSchema = z.enum(['ALERTA', 'ATENCAO', 'SEM_ALERTA', 'SEM_DADO']);
export const floodReasonSchema = z.enum(['CHUVA_AUSENTE', 'PREVISAO_INDISPONIVEL', 'SEM_TERRENO', 'TERRENO_EM_REVISAO', 'SERIE_INCOMPLETA',
  'MARE_AUSENTE']);

const num = z.number().nullable().optional();

export const floodHorizonSchema = z.object({
  hours: z.number().int(),
  level: floodLevelSchema,
  rainQ50Mm: num,
  rainQ95Mm: num,
  sheetQ50Cm: num,
  sheetQ95Cm: num,
  validUntil: isoSchema.nullable().optional(),
  /** Onda 16, 4.1: sheetQ50Cm usa a capacidade máxima da faixa e sheetQ95Cm a mínima; estas são as outras duas pontas. */
  sheetQ50CmQmin: num,
  sheetQ95CmQmax: num,
  /** Pico de 10 min previsto (rain_v1p), limitado ao acumulado. */
  peak10Q50Mm: num,
  peak10Q95Mm: num,
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
  /** Maré prevista (m, NR) no fim do passo e fração da capacidade da galeria livre (refluxo, ADR 0030). */
  tideNrM: num,
  outflowFactor: num,
});

/** Lâmina por cenário (q50, q95) e prazo ("1", "3", "6"). */
const gridSchema = z.record(z.string(), z.record(z.string(), z.number().nullable()));
const factorStatusSchema = z.enum(['OK', 'DESLIGADO', 'NAO_SE_APLICA', 'SEM_DADO']);
const factorModeSchema = z.enum(['OFF', 'INFO', 'NIVEL']);

/** Fatores por ponto do alerta único (ADR 0030): maré (refluxo) e limpeza da Central 156, com a contribuição de cada um. */
export const floodFactorsSchema = z.object({
  refluxo: z.object({
    mode: factorModeSchema.nullable().optional(),
    status: factorStatusSchema,
    appliedToLevel: z.boolean(),
    reason: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    sillNrM: num,
    tideNowNrM: num,
    tideMaxHorizonNrM: num,
    reductionNowPct: num,
    periods: z.array(z.object({ from: isoSchema, to: isoSchema, meanReductionPct: num, maxReductionPct: num })).default([]),
    servedDeltaCm: num,
    deltaSheetCm: gridSchema.default({}),
    biasScenario: z.object({
      mdtBiasM: num, sillNrM: num, level: floodLevelSchema.nullable().optional(), worstHorizonHours: z.number().int().nullable().optional(),
      sheetCm: gridSchema.default({}),
    }).nullable().optional(),
  }).nullable().optional(),
  limpeza: z.object({
    mode: factorModeSchema.nullable().optional(),
    status: factorStatusSchema,
    appliedToLevel: z.boolean(),
    reason: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    regime: z.string().nullable().optional(),
    daysSinceCleaning: num,
    pClogged: num,
    fClogged: num,
    mixtureLevel: floodLevelSchema.nullable().optional(),
    sheetCloggedCm: gridSchema.default({}),
    probHcrit: gridSchema.default({}),
  }).nullable().optional(),
});
export type FloodFactors = z.infer<typeof floodFactorsSchema>;

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
  factors: floodFactorsSchema.nullable().optional(),
  /** Capacidade efetiva da galeria como faixa (onda 16, 4.1). */
  capacity: z.object({
    base: z.string().nullable().optional(), qMinM3s: num, qMaxM3s: num, iEqMinMmH: num, iEqMaxMmH: num, kappa: num,
  }).nullable().optional(),
  servedCapacity: z.enum(['q_min', 'q_max']).nullable().optional(),
  profileMethod: z.string().nullable().optional(),
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

/** GET /api/alagamento/status (só ADMIN): versões da IA pelo /health e o último ciclo (tela Dados, 5.8). */
export const alagamentoStatusSchema = z.object({
  aiReachable: z.boolean(),
  rainModelVersion: z.string().nullable().optional(),
  bucketVersion: z.string().nullable().optional(),
  floodVersion: z.string().nullable().optional(),
  codeVersion: z.string().nullable().optional(),
  codeDirty: z.string().nullable().optional(),
  lastCycleAt: isoSchema.nullable().optional(),
  byLevel: z.record(z.string(), z.number()),
  semDadoByReason: z.record(z.string(), z.number()),
  shadow: z.boolean(),
});
export type AlagamentoStatus = z.infer<typeof alagamentoStatusSchema>;

/** GET /api/alagamento/historico?horas=N: um item por ciclo e ponto (relatório do evento e linha do tempo). */
export const alagamentoHistoricoSchema = z.object({
  from: isoSchema,
  to: isoSchema,
  points: z.array(z.object({
    slug: z.string(),
    name: z.string().nullable().optional(),
    items: z.array(z.object({
      at: isoSchema,
      level: floodLevelSchema,
      worstHorizonHours: z.number().int().nullable().optional(),
      hNowCm: z.number().nullable().optional(),
      reason: z.string().nullable().optional(),
    })),
  })),
});
export type AlagamentoHistorico = z.infer<typeof alagamentoHistoricoSchema>;
