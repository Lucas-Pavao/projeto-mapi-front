import { z } from 'zod';
import { degradationReasonSchema, isoSchema, modelValidationStatusSchema, pageOf, riskLevelSchema } from '@/lib/apiSchemas';

export const alertKindSchema = z.enum(['RISK_LEVEL', 'RIVER_STAGE', 'TIDE_ABOVE', 'RAIN_RATE', 'SENSOR_STALE', 'PREDICTION_UNAVAILABLE']);

export const alertSchema = z.object({
  id: z.number(),
  ruleId: z.number().nullable().optional(),
  kind: alertKindSchema,
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  floodPointSlug: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  title: z.string(),
  detail: z.string().nullable().optional(),
  observedValue: z.number().nullable().optional(),
  riskLevel: riskLevelSchema.nullable().optional(),
  degradationReason: degradationReasonSchema.nullable().optional(),
  modelValidationStatus: modelValidationStatusSchema.nullable().optional(),
  triggeredAt: isoSchema,
  acknowledgedAt: isoSchema.nullable().optional(),
  acknowledgedBy: z.string().nullable().optional(),
});
export type Alert = z.infer<typeof alertSchema>;

export const alertPageSchema = pageOf(alertSchema);
export type AlertPage = z.infer<typeof alertPageSchema>;
