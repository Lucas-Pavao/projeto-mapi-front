import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

export const sensorTypeSchema = z.enum(['PRECIPITATION', 'RIVER_LEVEL']);
export type SensorType = z.infer<typeof sensorTypeSchema>;

export const sensorFreshnessSchema = z.object({
  sensorId: z.string(),
  type: sensorTypeSchema,
  value: z.number().nullable().optional(),
  observedAt: isoSchema,
  ageSeconds: z.number(),
  stale: z.boolean(),
});
export type SensorFreshness = z.infer<typeof sensorFreshnessSchema>;
