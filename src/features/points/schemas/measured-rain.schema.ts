import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

/**
 * GET /api/pontos/{slug}/chuva-medida (onda 16, Fase 7.3): chuva MEDIDA acumulada no ponto na última hora fechada. Hora do
 * ponto = maior valor entre as estações válidas a até 5 km (ADR 0022). Acumulado com hora sem valor é nulo, nunca zero.
 */
const num = z.number().nullable().optional();
export const measuredRainSchema = z.object({
  slug: z.string(),
  hourEndUtc: isoSchema,
  rain1hMm: num, rain3hMm: num, rain6hMm: num, rain24hMm: num,
  n3h: num, n6h: num, n24h: num,
  source: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  stationDistanceM: num,
  ruleVersion: z.string(),
  rule: z.string(),
  attribution: z.string(),
});
export type MeasuredRain = z.infer<typeof measuredRainSchema>;
