import { z } from 'zod';

/** GET /api/alerta/latencia (item 2.1). Segundos. */
export const latencySegmentSchema = z.object({
  segment: z.string(),
  wetHour: z.boolean(),
  n: z.number(),
  medianS: z.number().nullable(),
  p90S: z.number().nullable(),
  maxS: z.number().nullable(),
});
export const latencySchema = z.object({
  from: z.string(),
  to: z.string(),
  budgetP90Minutes: z.number(),
  segments: z.array(latencySegmentSchema),
  withinBudgetWet: z.boolean().nullable().optional(),
  withinBudgetDry: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
}).passthrough();

export const latencyReportSchema = z.object({
  day: z.string(),
  maxPointRainMm: z.number(),
  withinBudgetWet: z.boolean().nullable().optional(),
  generatedAt: z.string(),
}).passthrough();

/** GET /api/alerta/conferencia (item 4.2). */
export const conferenciaRowSchema = z.object({
  day: z.string(),
  slug: z.string(),
  forteEvents: z.number(),
  forteWarned: z.number(),
  leadMinutes: z.array(z.number()).nullable().optional(),
  alertEpisodes: z.number(),
  falseEpisodes: z.number(),
  semDadoMinutes: z.number(),
  evaluatedMinutes: z.number(),
  floodEpisodes: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  shadow: z.boolean(),
});
export const conferenciaSchema = z.object({
  days: z.number(),
  forteEvents: z.number(),
  forteWarned: z.number(),
  medianLeadMinutes: z.number().nullable().optional(),
  falsePerEvent: z.number(),
  semDadoFraction: z.number(),
  floodEpisodes: z.number(),
  rows: z.array(conferenciaRowSchema),
  note: z.string().nullable().optional(),
}).passthrough();

export type Latency = z.infer<typeof latencySchema>;
export type LatencyReport = z.infer<typeof latencyReportSchema>;
export type Conferencia = z.infer<typeof conferenciaSchema>;
