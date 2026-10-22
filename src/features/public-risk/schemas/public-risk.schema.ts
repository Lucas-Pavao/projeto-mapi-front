import { z } from 'zod';
import { degradationReasonSchema, isoSchema, modelValidationStatusSchema, riskLevelSchema } from '@/lib/apiSchemas';

export const publicRiskSchema = z.object({
  nearestPoint: z
    .object({
      slug: z.string(),
      name: z.string(),
      distanceM: z.number(),
      riskLevel: riskLevelSchema,
      issuedAt: isoSchema,
      validUntil: isoSchema.nullable().optional(),
      degradationReason: degradationReasonSchema.nullable().optional(),
    })
    .nullable(),
  rainLastHourMm: z.number().nullable().optional(),
  rainStationId: z.string().nullable().optional(),
  modelValidationStatus: modelValidationStatusSchema,
  /** Texto de RISK_MEANING, sem reescrita. */
  meaning: z.string(),
});
export type PublicRisk = z.infer<typeof publicRiskSchema>;
