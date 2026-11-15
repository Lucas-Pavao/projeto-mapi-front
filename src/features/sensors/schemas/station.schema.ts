import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';
import { monthStatusSchema } from '@/features/points/schemas/rain-candidates.schema';

/** Citação obrigatória onde houver dado Cemaden (campo `attribution` das respostas). */
export const CEMADEN_ATTRIBUTION = 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC';

export const QUARANTINE_REASONS = ['GAP', 'AFTER_GAP', 'SUSPECT_QUALIFIER'] as const;

/** B1 — item de GET /api/stations/canonical. Campos novos por adição: ausentes (backend antigo) viram vazio, nunca zero inventado. */
export const canonicalStationSchema = z.object({
  canonicalId: z.string(),
  name: z.string().nullable().optional(),
  municipality: z.string().nullable().optional(),
  ibgeCode: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
  primarySource: z.string().nullable().optional(),
  aliases: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  monthCheck: z.object({
    monthStartUtc: isoSchema,
    status: monthStatusSchema,
    reasons: z.array(z.string()).default([]),
    ruleVersion: z.string().nullable().optional(),
  }).nullable().optional(),
  quarantine: z.record(z.string(), z.number()).default({}),
  divergenceCount: z.number().nullable().optional(),
  attribution: z.string().nullable().optional(),
}).passthrough();
export type CanonicalStation = z.infer<typeof canonicalStationSchema>;

/** A lista chega como array ou como { stations: [...] }; as duas formas passam. */
export const canonicalStationsSchema = z.union([
  z.array(canonicalStationSchema),
  z.object({ stations: z.array(canonicalStationSchema) }).transform((o) => o.stations),
]);

export const hourSourceSchema = z.enum(['CEMADEN', 'CEMADEN_PED']);
export type HourSource = z.infer<typeof hourSourceSchema>;

/** B2 — GET /api/stations/{canonicalId}/hourly: uma linha por hora da janela, inclusive sem dado (valueMm = null). */
export const stationHourlySchema = z.object({
  canonicalId: z.string(),
  from: isoSchema,
  to: isoSchema,
  toleranceMm: z.number().default(0.5),
  hours: z.array(z.object({
    hourEndUtc: isoSchema,
    valueMm: z.number().nullable(),
    usedSource: hourSourceSchema.nullable(),
    pedMm: z.number().nullable().optional(),
    liveMm: z.number().nullable().optional(),
    divergent: z.boolean().default(false),
    isolatedPeakRemoved: z.boolean().default(false),
  })),
  attribution: z.string().nullable().optional(),
});
export type StationHourly = z.infer<typeof stationHourlySchema>;
export type StationHour = StationHourly['hours'][number];
