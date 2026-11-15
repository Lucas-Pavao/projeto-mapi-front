import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

export const RAIN_SOURCES = ['CEMADEN_PED', 'ANA', 'OPEN_METEO_ARCHIVE'] as const;
export type RainSource = (typeof RAIN_SOURCES)[number];

const num = z.number().nullable().optional();

/** Manifesto das respostas de /api/analise/eventos-chuva (ADR 0017): só o que a tela usa; o resto passa. */
const manifestSchema = z.object({
  datasetId: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  params: z.record(z.string(), z.unknown()).nullable().optional(),
  rows: z.number().nullable().optional(),
  truncatedRows: z.number().nullable().optional(),
  rowsWithGap: z.number().nullable().optional(),
  limitations: z.array(z.string()).nullable().optional(),
}).passthrough();
export type RainManifest = z.infer<typeof manifestSchema>;

export const rainEventSchema = z.object({
  floodPointSlug: z.string(),
  eventId: z.string(),
  source: z.string().nullable().optional(),
  startUtc: isoSchema,
  endUtc: isoSchema.nullable().optional(),
  durationMin: num,
  totalMm: num,
  maxHourlyMmH: num,
  type: z.string().nullable().optional(),
  hasGap: z.boolean().nullable().optional(),
  truncated: z.boolean().nullable().optional(),
  stationId: z.string().nullable().optional(),
  stationDistanceM: num,
  rainOrigin: z.string().nullable().optional(),
  excessOverCapacityMm: num,
  hoursAboveCapacity: num,
}).passthrough();
export type RainEvent = z.infer<typeof rainEventSchema>;

export const rainEventTableSchema = z.object({ manifest: manifestSchema, events: z.array(rainEventSchema) });
export type RainEventTable = z.infer<typeof rainEventTableSchema>;

export const rainSummaryRowSchema = z.object({
  floodPointSlug: z.string(),
  type: z.string(),
  count: num,
  countWithoutGap: num,
  truncatedExcluded: num,
  countPerYear: num,
  p90IntensityMmH: num,
  meanTotalMm: num,
  eventsAboveCapacity: num,
  coverageFraction: num,
}).passthrough();
export type RainSummaryRow = z.infer<typeof rainSummaryRowSchema>;

export const rainSummarySchema = z.object({ manifest: manifestSchema, rows: z.array(rainSummaryRowSchema) });
export type RainSummary = z.infer<typeof rainSummarySchema>;
