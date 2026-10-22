import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

export const sensorTypeSchema = z.enum(['PRECIPITATION', 'RIVER_LEVEL']);
export type SensorType = z.infer<typeof sensorTypeSchema>;

/**
 * Item de GET /api/sensors/latest (redesign-telas.yaml, SensorFreshness). Os campos atuais do
 * SensorResponseDTO continuam na resposta; aqui entram os que a tela usa, e o resto passa.
 */
export const sensorFreshnessSchema = z
  .object({
    sensorId: z.string(),
    type: sensorTypeSchema,
    value: z.number().nullable().optional(),
    observedAt: isoSchema,
    ageSeconds: z.number(),
    stale: z.boolean(),
    unit: z.string().nullable().optional(),
    stationName: z.string().nullable().optional(),
    municipality: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .passthrough();
export type SensorFreshness = z.infer<typeof sensorFreshnessSchema>;

/** Evento `sensor` do /api/stream (SensorReadingEvent). */
export const sensorReadingEventSchema = z.object({
  sensorId: z.string(),
  type: sensorTypeSchema,
  value: z.number(),
  unit: z.string().optional(),
  observedAt: isoSchema,
});
export type SensorReadingEvent = z.infer<typeof sensorReadingEventSchema>;
