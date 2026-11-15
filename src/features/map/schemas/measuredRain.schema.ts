import { z } from 'zod';

/**
 * `GET /api/stations/rain-accumulations` (ADR 0023 do projeto-mapi-api, handoff `docs/handoff/etapa0.json`).
 * Chuva MEDIDA pelo pluviômetro do Cemaden, por estação canônica. Instantes em UTC; valores em mm.
 * Acumulado `null` = a estação não mediu na janela; NUNCA é zero. `status = NO_DATA` = nenhum acumulado.
 */
const mm = z.number().nullable();

export const stationAccumulationSchema = z.object({
  canonicalId: z.string().nullable(),
  stationCode: z.string().nullable(),
  name: z.string().nullable(),
  municipality: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  aliases: z.array(z.string()),
  status: z.enum(['OK', 'NO_DATA']),
  lastReadingUtc: z.string().nullable(),
  acc1hMm: mm,
  acc3hMm: mm,
  acc6hMm: mm,
  acc12hMm: mm,
  acc24hMm: mm,
  acc48hMm: mm,
  acc72hMm: mm,
  acc96hMm: mm,
  acc120hMm: mm,
});

export const measuredRainSchema = z.object({
  computedAtUtc: z.string().nullable(),
  fetchedAtUtc: z.string(),
  stale: z.boolean(),
  timezone: z.literal('UTC'),
  unit: z.literal('mm'),
  rainOrigin: z.literal('MEASURED'),
  source: z.string(),
  attribution: z.string(),
  municipalitiesQueried: z.array(z.string()),
  municipalitiesWithoutData: z.array(z.string()),
  municipalitiesFailed: z.array(z.string()),
  stations: z.array(stationAccumulationSchema),
});

export type StationAccumulation = z.infer<typeof stationAccumulationSchema>;
export type MeasuredRain = z.infer<typeof measuredRainSchema>;

export const validateMeasuredRain = (data: unknown): MeasuredRain => measuredRainSchema.parse(data);
