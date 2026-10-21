import { z } from 'zod';
import { isoSchema, severitySchema } from '@/lib/apiSchemas';
import { predictionSummarySchema } from '@/features/points/schemas/prediction.schema';

const timePointSchema = z.object({ t: isoSchema, v: z.number().nullable() });
const seriesByStation = z.array(z.object({ stationId: z.string(), points: z.array(timePointSchema) }));

export const timelineSchema = z.object({
  from: isoSchema,
  to: isoSchema,
  stepMinutes: z.number(),
  rain: seriesByStation,
  tide: z.object({ harbor: z.string(), points: z.array(timePointSchema) }),
  river: seriesByStation,
  risk: z.array(z.object({ slug: z.string(), items: z.array(predictionSummarySchema) })),
  floodEvents: z.array(z.object({ id: z.number(), slug: z.string(), startTime: isoSchema, severity: severitySchema })).optional(),
});
export type Timeline = z.infer<typeof timelineSchema>;
