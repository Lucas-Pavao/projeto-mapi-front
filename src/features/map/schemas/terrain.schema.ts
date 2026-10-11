import { z } from 'zod';

/**
 * `GET /api/pontos/{slug}/terrain` (TerrainResponseDTO; ADR 0008 e 0009). Só os campos que o painel
 * usa; `.passthrough()` aceita o resto. Atributos nulos quando `status = NO_DATA`, nunca zero.
 * `diagnostics.contributingAreaBySnapM2` traz a área para snap de 0/5/10/20 m (chaves "0m"…"20m").
 */
const snapAreasSchema = z.record(z.string(), z.number().nullable());

export const terrainResponseSchema = z
  .object({
    floodPointSlug: z.string(),
    status: z.enum(['OK', 'NO_DATA']),
    streetElevationM: z.number().nullable().optional(),
    contributingAreaM2: z.number().nullable().optional(),
    diagnostics: z
      .object({
        contributingAreaBySnapM2: snapAreasSchema.optional().catch(undefined),
        basinTouchesWindowEdge: z.boolean().optional().catch(undefined),
        snapDistanceM: z.number().optional().catch(undefined),
      })
      .passthrough()
      .nullable()
      .optional()
      .catch(undefined),
    provenance: z
      .object({ flightYear: z.number().nullable().optional(), verticalReference: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional()
      .catch(undefined),
    tideComparabilityWarning: z.string().nullable().optional(),
  })
  .passthrough();

export type TerrainResponse = z.infer<typeof terrainResponseSchema>;

export const validateTerrain = (data: unknown): TerrainResponse => terrainResponseSchema.parse(data);
