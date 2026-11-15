import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

/** Estado da checagem do mês de uma estação PED (B1/B3). A API devolve OK; no banco é PASS. */
export const monthStatusSchema = z.enum(['OK', 'UNCHECKED', 'FAIL', 'OFFLINE']);
export type MonthStatus = z.infer<typeof monthStatusSchema>;

export const MONTH_REASONS = ['PARTIAL_COVERAGE', 'STUCK_ZERO', 'UNDERCATCH', 'OVERCATCH', 'FEW_WET_NEIGHBORS'] as const;
export const monthReasonSchema = z.string();

export const candidateRoleSchema = z.enum(['USED', 'LOWER', 'EXCLUDED', 'NO_VALUE']);
export type CandidateRole = z.infer<typeof candidateRoleSchema>;

/** B3 — GET /api/pontos/{slug}/rain-candidates: estações até 5 km e qual delas deu a chuva do ponto. */
export const rainCandidatesSchema = z.object({
  slug: z.string(),
  hourEndUtc: isoSchema.nullable().optional(),
  radiusM: z.number(),
  ruleVersion: z.string().nullable().optional(),
  valueMm: z.number().nullable(),
  usedStationId: z.string().nullable(),
  candidates: z.array(z.object({
    stationId: z.string(),
    name: z.string(),
    distanceM: z.number(),
    valueMm: z.number().nullable(),
    monthStatus: monthStatusSchema,
    reasons: z.array(monthReasonSchema),
    role: candidateRoleSchema,
  })),
  attribution: z.string(),
});
export type RainCandidates = z.infer<typeof rainCandidatesSchema>;
export type RainCandidate = RainCandidates['candidates'][number];
