import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';
import { floodLevelSchema } from '@/features/alagamento/schemas/alagamento.schema';
import { officialWarningSchema } from '@/features/warnings/schemas/officialWarning.schema';

/** Período da previsão do INMET: turnos nos 2 primeiros dias, DIA nos seguintes. */
export const forecastPeriodSchema = z.enum(['MANHA', 'TARDE', 'NOITE', 'DIA']);
export type ForecastPeriod = z.infer<typeof forecastPeriodSchema>;

const num = z.number().nullable().optional();

/**
 * Previsão oficial do INMET por município (GET /api/previsao-oficial/{municipio}). Sem quantidade de chuva na origem.
 * firstSeenAt/lastSeenAt: quando o MAPi viu a versão (o INMET não publica a hora de emissão).
 */
export const officialForecastSchema = z.object({
  source: z.string(),
  sourceLabel: z.string(),
  attribution: z.string(),
  note: z.string(),
  ibge: z.string().nullable().optional(),
  municipality: z.string().nullable().optional(),
  lastCollectedAt: isoSchema.nullable().optional(),
  ageMinutes: z.number().nullable().optional(),
  stale: z.boolean(),
  reason: z.string().nullable().optional(),
  reasonText: z.string().nullable().optional(),
  days: z.array(z.object({
    date: z.string(),
    periods: z.array(z.object({
      period: forecastPeriodSchema,
      summary: z.string().nullable().optional(),
      iconCode: z.string().nullable().optional(),
      tempMax: num,
      tempMin: num,
      humidityMax: num,
      humidityMin: num,
      windDir: z.string().nullable().optional(),
      windIntensity: z.string().nullable().optional(),
      firstSeenAt: isoSchema,
      lastSeenAt: isoSchema,
    })),
  })),
});
export type OfficialForecast = z.infer<typeof officialForecastSchema>;
export type ForecastEntry = OfficialForecast['days'][number]['periods'][number];

/** GET /api/horizontes/{slug}: INMET, dia de risco e próxima hora, lado a lado e sem combinar. */
export const horizonsSchema = z.object({
  slug: z.string(),
  name: z.string().nullable().optional(),
  municipality: z.string().nullable().optional(),
  ibge: z.string().nullable().optional(),
  generatedAt: isoSchema,
  official: z.object({
    origin: z.string(),
    attribution: z.string(),
    warnings: z.array(officialWarningSchema),
    warningsReason: z.string().nullable().optional(),
    warningsReasonText: z.string().nullable().optional(),
    warningsCheckedAt: isoSchema.nullable().optional(),
    forecast: officialForecastSchema,
  }),
  dayRisk: z.object({
    available: z.boolean(),
    origin: z.string(),
    version: z.string(),
    reason: z.string().nullable().optional(),
    reasonText: z.string().nullable().optional(),
    report: z.string().nullable().optional(),
  }),
  nextHour: z.object({
    origin: z.string(),
    level: floodLevelSchema.nullable().optional(),
    worstHorizonHours: z.number().int().nullable().optional(),
    experimental: z.boolean(),
    inTest: z.boolean(),
    issuedAt: isoSchema.nullable().optional(),
    ageMinutes: z.number().nullable().optional(),
    reason: z.string().nullable().optional(),
    reasonText: z.string().nullable().optional(),
  }),
});
export type Horizons = z.infer<typeof horizonsSchema>;
