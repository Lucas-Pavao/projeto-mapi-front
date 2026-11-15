import { z } from 'zod';
import { degradationReasonSchema, isoSchema, modelValidationStatusSchema, riskLevelSchema } from '@/lib/apiSchemas';
import { riskThresholdsSchema } from '@/features/map/schemas/floodPointResponse.schema';

export const predictionSummarySchema = z.object({
  slug: z.string(),
  riskLevel: riskLevelSchema,
  probability: z.number().nullable().optional(),
  issuedAt: isoSchema,
  validUntil: isoSchema.nullable().optional(),
  horizonHours: z.number().nullable().optional(),
  modelVersion: z.string().nullable().optional(),
  degradationReason: degradationReasonSchema.nullable().optional(),
  lastValidIssuedAt: isoSchema.nullable().optional(),
  modelValidationStatus: modelValidationStatusSchema,
  // Etapa 8 do IN1165: o stream e a série carregam a etiqueta do modelo (sintético) e os limiares.
  riskThresholds: riskThresholdsSchema.nullable().optional(),
  trainingData: z.string().nullable().optional(),
  syntheticWarning: z.string().nullable().optional(),
  // B5: fonte da chuva do treino/da previsão.
  rainSource: z.string().nullable().optional(),
});
export type PredictionSummary = z.infer<typeof predictionSummarySchema>;

export const predictionSeriesSchema = z.object({
  slug: z.string(),
  from: isoSchema,
  to: isoSchema,
  items: z.array(predictionSummarySchema),
});
export type PredictionSeries = z.infer<typeof predictionSeriesSchema>;

export const riskSummarySchema = z.object({
  LOW: z.number(),
  MEDIUM: z.number(),
  HIGH: z.number(),
  UNKNOWN: z.number(),
  computedAt: isoSchema,
});
export type RiskSummary = z.infer<typeof riskSummarySchema>;
