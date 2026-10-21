import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';
import { sensorTypeSchema } from '@/features/sensors/schemas/sensor.schema';

/** Corpo de PATCH /api/pontos/{slug} (FloodPointPatch). Pelo menos um campo. */
export const floodPointPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    active: z.boolean().optional(),
    alertThresholdMm: z.number().nonnegative().nullable().optional(),
    pluviometerStationIds: z.array(z.string()).optional(),
    riverLevelStationIds: z.array(z.string()).optional(),
    weatherStationIds: z.array(z.string()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada mudou.' });
export type FloodPointPatch = z.infer<typeof floodPointPatchSchema>;

/** Item de GET /api/pontos/station-suggestions. */
export const stationSuggestionSchema = z.object({
  stationId: z.string(),
  name: z.string(),
  type: sensorTypeSchema,
  source: z.string(),
  distanceM: z.number(),
  lastReadingAt: isoSchema.nullable().optional(),
});
export type StationSuggestion = z.infer<typeof stationSuggestionSchema>;
