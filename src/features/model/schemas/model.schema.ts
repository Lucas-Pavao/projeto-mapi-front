import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';

export const modelEvaluationSchema = z.object({
  sha256: z.string(),
  source: z.string(),
  frozenAt: isoSchema.nullable().optional(),
  result: z.record(z.string(), z.unknown()),
});
export type ModelEvaluation = z.infer<typeof modelEvaluationSchema>;

export const bucketSimulationSchema = z.object({
  model: z.literal('M1a'),
  illustrative: z.literal(true),
  hMm: z.array(z.number()),
  hmaxMm: z.number(),
  tCrossH: z.number().nullable().optional(),
  nOutsideCurve: z.number(),
  paramsUsed: z.object({
    C: z.number(),
    iT_mm_h: z.number(),
    f: z.number(),
    hcrit_mm: z.number(),
    snap_m: z.number(),
    curve_scale: z.number(),
  }),
});
export type BucketSimulation = z.infer<typeof bucketSimulationSchema>;
