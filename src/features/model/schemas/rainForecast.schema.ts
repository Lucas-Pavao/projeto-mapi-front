import { z } from 'zod';
import raw from '../data/rain_v1_card.json';

/** Cartão do modelo de chuva (gerado de projeto-mapi-ai/reports/v4/rain/evaluation.json): números do teste, fixos. */
const rainCardSchema = z.object({
  modelVersion: z.string(),
  target: z.string(),
  attribution: z.string(),
  source: z.string(),
  testPeriod: z.string(),
  forteEventsInTest: z.number(),
  horizons: z.array(z.object({
    horizonHours: z.number(),
    model: z.string(),
    pinballMm: z.number(),
    pinballPersistenceMm: z.number(),
    coverageQ50: z.number(),
    coverageQ80: z.number(),
    coverageQ95: z.number(),
    forteRecallRaining: z.number(),
    forteRecallDry: z.number(),
    forteEventsWarned: z.number(),
    leadMedianMin: z.number(),
    leadCi95Min: z.tuple([z.number(), z.number()]),
    warnedWhileDryPct: z.number(),
    falsePerEvent: z.number(),
  })),
});
export type RainCard = z.infer<typeof rainCardSchema>;
export const loadRainCard = (): RainCard | null => {
  const r = rainCardSchema.safeParse(raw);
  return r.success ? r.data : null;
};

/** GET /api/rain-forecast/accuracy: conferência diária contra a chuva medida. */
export const rainForecastAccuracySchema = z.object({
  days: z.number(),
  from: z.string(),
  to: z.string(),
  lastVerifiedAt: z.string().nullable().optional(),
  pending: z.number(),
  horizons: z.array(z.object({
    horizonHours: z.number(),
    forecasts: z.number(),
    withoutMeasure: z.number(),
    pinballMm: z.number().nullable().optional(),
    coverageQ50: z.number().nullable().optional(),
    coverageQ80: z.number().nullable().optional(),
    coverageQ95: z.number().nullable().optional(),
    meanObservedMm: z.number().nullable().optional(),
    forteEvents: z.number(),
    forteAlerts: z.number(),
    forteHits: z.number(),
  })),
  attribution: z.string(),
}).passthrough();
export type RainForecastAccuracy = z.infer<typeof rainForecastAccuracySchema>;
