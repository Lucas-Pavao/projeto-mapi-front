import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';
import { monthStatusSchema } from '@/features/points/schemas/rain-candidates.schema';

/** B4 — GET /api/admin/stations/month-checks?from=&to= (ADMIN): grade estação × mês da checagem espacial. */
export const monthChecksSchema = z.object({
  ruleVersion: z.string().nullable().optional(),
  months: z.array(isoSchema),
  stations: z.array(z.object({
    stationId: z.string(),
    name: z.string().nullable().optional(),
    cells: z.array(z.object({ monthStartUtc: isoSchema, status: monthStatusSchema, reasons: z.array(z.string()).default([]) })),
  })),
});
export type MonthChecks = z.infer<typeof monthChecksSchema>;
