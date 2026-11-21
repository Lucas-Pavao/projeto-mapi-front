import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';
import { floodLevelSchema } from '@/features/alagamento/schemas/alagamento.schema';

/**
 * GET /api/public/risk ("Minha rua", ADR 0013) pelo alerta por regressão: nível do ponto monitorado mais perto, sem
 * probabilidade. `inTest`: o alerta está em modo sombra; o nível vem SEM_DADO e a manchete diz que está em teste.
 */
export const publicRiskSchema = z.object({
  nearestPoint: z
    .object({
      slug: z.string(),
      name: z.string(),
      distanceM: z.number(),
      level: floodLevelSchema,
      worstHorizonHours: z.number().int().nullable().optional(),
      issuedAt: isoSchema.nullable().optional(),
      reason: z.string().nullable().optional(),
    })
    .nullable(),
  rainLastHourMm: z.number().nullable().optional(),
  rainStationId: z.string().nullable().optional(),
  experimental: z.boolean(),
  inTest: z.boolean(),
  /** Manchete da tela, a mesma da API (RiskMeaning). */
  meaning: z.string(),
});
export type PublicRisk = z.infer<typeof publicRiskSchema>;
