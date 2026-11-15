import { z } from 'zod';

export const RAIN_SOURCES = ['CEMADEN_PED', 'ANA', 'OPEN_METEO_ARCHIVE'] as const;
export type RainSource = (typeof RAIN_SOURCES)[number];

const num = z.number().nullable().optional();

/** Evento de chuva de eventos_chuva_5anos.json (gerado de /api/analise/eventos-chuva, ADR 0017). */
export const rainEventSchema = z.object({
  slug: z.string(),
  startUtc: z.string(),
  durationMin: num,
  totalMm: num,
  maxHourlyMmH: num,
  type: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  stationDistanceM: num,
  excessOverCapacityMm: num,
  hasGap: z.boolean().nullable().optional(),
  truncated: z.boolean().nullable().optional(),
});
export type RainEvent = z.infer<typeof rainEventSchema>;

export const rainSummaryRowSchema = z.object({
  slug: z.string(),
  type: z.string(),
  count: num,
  countPerYear: num,
  meanDurationMin: num,
  fractionOfTime: num,
  eventsAboveCapacity: num,
  coverageFraction: num,
});
export type RainSummaryRow = z.infer<typeof rainSummaryRowSchema>;

export const rainSourceDataSchema = z.object({
  periodFrom: z.string(),
  periodTo: z.string(),
  params: z.object({ capacityMmH: z.number(), typeBoundsMmH: z.record(z.string(), z.number()).optional() }).passthrough(),
  sha256: z.record(z.string(), z.string()),
  summary: z.array(rainSummaryRowSchema),
  events: z.array(rainEventSchema),
});
export type RainSourceData = z.infer<typeof rainSourceDataSchema>;

export const rainDataSchema = z.object({
  attribution: z.string().nullable().optional(),
  sources: z.object({ CEMADEN_PED: rainSourceDataSchema, ANA: rainSourceDataSchema, OPEN_METEO_ARCHIVE: rainSourceDataSchema }),
});
export type RainData = z.infer<typeof rainDataSchema>;
