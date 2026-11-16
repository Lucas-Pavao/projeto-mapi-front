import { z } from 'zod';
import { monthStatusSchema, candidateRoleSchema } from '@/features/points/schemas/rain-candidates.schema';

/** Estado do card do pluviômetro, em ordem de prioridade (B6): o primeiro que vale. */
export const STATION_STATES = ['NO_RESPONSE', 'GAP_NOW', 'FAIL_MONTH', 'DIVERGENT', 'PEAK_REMOVED', 'UNCHECKED', 'NORMAL'] as const;
export const stationStateSchema = z.enum(STATION_STATES);
export type StationState = z.infer<typeof stationStateSchema>;

const mm = z.number().nullable().optional();

/** B6 — GET /api/stations/{canonicalId}/card?at=. Ausente = null, nunca 0. */
export const stationCardSchema = z.object({
  canonicalId: z.string(),
  name: z.string().nullable().optional(),
  aliases: z.array(z.string()).default([]),
  aliasDistanceM: mm,
  sources: z.array(z.string()).default([]),
  pedOnly: z.boolean().default(false),
  state: stationStateSchema,
  nowMmH: mm,
  nowSource: z.enum(['CEMADEN', 'CEMADEN_PED']).nullable().optional(),
  liveMmH: mm,
  pedMmH: mm,
  pedPending: z.boolean().default(false),
  blocks: z.array(z.object({
    endUtc: z.string(),
    mm,
    source: z.enum(['CEMADEN', 'CEMADEN_PED']).nullable().optional(),
    peakRemoved: z.boolean().default(false),
  })).default([]),
  acc1hMm: mm,
  acc3hMm: mm,
  acc24hMm: mm,
  note: z.object({
    kind: z.string(),
    hourEndUtc: z.string().nullable().optional(),
    liveMm: mm,
    pedMm: mm,
    diffMm: mm,
  }).passthrough().nullable().optional(),
  monthCheck: z.object({ monthStartUtc: z.string(), status: monthStatusSchema, reasons: z.array(z.string()).default([]) }).nullable().optional(),
  quarantineToday: z.record(z.string(), z.number()).default({}),
  uses: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    distanceM: z.number(),
    role: candidateRoleSchema,
    usedStationName: z.string().nullable().optional(),
  })).default([]),
  lastReadingUtc: z.string().nullable().optional(),
  attribution: z.string().nullable().optional(),
});
export type StationCardData = z.infer<typeof stationCardSchema>;
