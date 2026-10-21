import { z } from 'zod';
import { isoSchema, pageOf, roleSchema } from '@/lib/apiSchemas';

export const ingestionStatusSchema = z.enum(['OK', 'DELAYED', 'FAILING', 'QUARANTINED', 'IDLE']);
export type IngestionStatus = z.infer<typeof ingestionStatusSchema>;

export const ingestionSourceSchema = z.object({
  source: z.string(),
  status: ingestionStatusSchema,
  expectedEveryMinutes: z.number().nullable().optional(),
  lastSuccessAt: isoSchema.nullable().optional(),
  lastRunId: z.number().nullable().optional(),
  lastError: z.string().nullable().optional(),
  rowsLast24h: z.number().optional(),
});
export type IngestionSource = z.infer<typeof ingestionSourceSchema>;

export const userSummarySchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  email: z.string(),
  role: roleSchema,
  active: z.boolean(),
  lastLoginAt: isoSchema.nullable().optional(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const userPageSchema = pageOf(userSummarySchema);
export type UserPage = z.infer<typeof userPageSchema>;
