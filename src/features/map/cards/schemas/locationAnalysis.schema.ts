import { z } from 'zod';
import { candidateRoleSchema, monthStatusSchema } from '@/features/points/schemas/rain-candidates.schema';
import { riskLevelSchema } from '@/features/map/schemas/floodPointResponse.schema';

const n = z.number().nullable().optional();

export const RAIN_MODES = ['MEASURED', 'GAP', 'ESTIMATED'] as const;
export const rainModeSchema = z.enum(RAIN_MODES);
export type RainMode = z.infer<typeof rainModeSchema>;

/** B7 — GET /api/locations/analysis?lat=&lon=&at=. Medido e estimado nunca se misturam: `rain.mode` diz qual é. */
/** Origem da maré: tábua oficial ou previsão harmônica de reserva. */
const tideSourceSchema = z.enum(['OFFICIAL', 'HARMONIC']);

export const locationAnalysisSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  at: z.string().nullable().optional(),
  inArea: z.boolean().default(true),
  isSea: z.boolean().default(false),
  rain: z.object({
    mode: rainModeSchema,
    nowMmH: n, acc3hMm: n, acc24hMm: n,
    station: z.object({ stationId: z.string(), name: z.string(), distanceM: z.number() }).nullable().optional(),
    candidates: z.array(z.object({
      stationId: z.string(), name: z.string(), distanceM: z.number(), valueMmH: n,
      monthStatus: monthStatusSchema, reasons: z.array(z.string()).default([]), role: candidateRoleSchema,
      lat: n, lon: n,
    })).default([]),
    nValid: z.number().nullable().optional(),
  }),
  nearestPoint: z.object({
    slug: z.string(), name: z.string(), distanceKm: n, riskLevel: riskLevelSchema, probability: n, degradationReason: z.string().nullable().optional(),
  }).nullable().optional(),
  tide: z.object({ levelM: n, rising: z.boolean().nullable().optional(), harbor: z.string().nullable().optional(), verticalReference: z.string().nullable().optional(), tideSource: tideSourceSchema.nullable().optional() }).nullable().optional(),
  river: z.object({ stationId: z.string(), name: z.string(), levelM: n, distanceKm: n, outsideModel: z.boolean().default(true) }).nullable().optional(),
  terrain: z.object({ elevationM: n, distanceToCoastKm: n }).nullable().optional(),
  weather: z.object({ temperatureC: n, humidityPct: n, windKmh: n, source: z.string().nullable().optional() }).nullable().optional(),
  attribution: z.string().nullable().optional(),
});
export type LocationAnalysis = z.infer<typeof locationAnalysisSchema>;
export type LocationCandidate = LocationAnalysis['rain']['candidates'][number];
