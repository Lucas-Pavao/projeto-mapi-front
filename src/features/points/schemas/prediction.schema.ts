import { z } from 'zod';
import { degradationReasonSchema, isoSchema, modelValidationStatusSchema, riskLevelSchema } from '@/lib/apiSchemas';

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
