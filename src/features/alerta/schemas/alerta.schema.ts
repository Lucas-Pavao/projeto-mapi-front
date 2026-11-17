import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

/** GET /api/alerta/pontos (ADR 0026 do projeto-mapi-api). Dois campos com fontes e falhas diferentes. */
export const rainAlertSchema = z.enum(['NENHUM', 'ATENCAO', 'ALERTA', 'SEM_DADO']);
export const pointFloodSchema = z.enum(['NAO', 'PROVAVEL', 'SEM_DADO']);

const num = z.number().nullable().optional();

export const alertaPontoSchema = z.object({
  slug: z.string(),
  name: z.string().nullable().optional(),
  rainAlert: rainAlertSchema,
  rainReason: z.string().nullable().optional(),
  rainReasonText: z.string().nullable().optional(),
  pointFlood: pointFloodSchema,
  floodReason: z.string().nullable().optional(),
  floodReasonText: z.string().nullable().optional(),
  rainSince: isoSchema.nullable().optional(),
  trigger: z.string().nullable().optional(),
  probForte1h: num,
  probOn: num,
  probOff: num,
  rainTeMm: num,
  capacityTeMm: num,
  rain30minMm: num,
  hNowCm: num,
  hProjQ50MaxCm: num,
  hProjQ80MaxCm: num,
  floodInMinutes: z.number().int().nullable().optional(),
  rainModelVersion: z.string().nullable().optional(),
  bucketVersion: z.string().nullable().optional(),
  trYears: num,
  teMinutes: num,
  sources: z.array(z.string()).nullable().optional(),
  latestReadingUtc: isoSchema.nullable().optional(),
  latestReadingAgeMinutes: num,
  eventId: z.string().nullable().optional(),
  shadow: z.boolean(),
  updatedAt: isoSchema.nullable().optional(),
  physicalModelLabel: z.string().nullable().optional(),
  attribution: z.string().nullable().optional(),
}).passthrough();

export const alertaPontosSchema = z.array(alertaPontoSchema);

export type RainAlert = z.infer<typeof rainAlertSchema>;
export type PointFlood = z.infer<typeof pointFloodSchema>;
export type AlertaPonto = z.infer<typeof alertaPontoSchema>;
