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

export const alertSeveritySchema = z.enum(['INFO', 'WARNING', 'CRITICAL']);
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertKind = z.infer<typeof alertKindSchema>;

/** Corpo de POST /api/alert-rules e PUT /api/alert-rules/{id} (AlertRuleInput). */
export const alertRuleInputSchema = z
  .object({
    kind: alertKindSchema,
    floodPointSlug: z.string().nullable().optional(),
    stationId: z.string().nullable().optional(),
    threshold: z.number().nullable().optional(),
    thresholdSource: z.string().nullable().optional(),
    minRisk: z.enum(['MEDIUM', 'HIGH']).nullable().optional(),
    enabled: z.boolean(),
    channels: z.array(z.literal('BROWSER')).optional(),
  });
export type AlertRuleInput = z.infer<typeof alertRuleInputSchema>;

/** AlertRule = AlertRuleInput + id, createdBy, createdAt, updatedAt. */
export const alertRuleSchema = alertRuleInputSchema.extend({
  id: z.number(),
  createdBy: z.string(),
  createdAt: isoSchema,
  updatedAt: isoSchema.nullable().optional(),
});
export type AlertRule = z.infer<typeof alertRuleSchema>;
