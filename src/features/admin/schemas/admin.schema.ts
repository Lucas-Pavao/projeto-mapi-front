import { z } from 'zod';
import { isoSchema, pageOf, roleSchema } from '@/lib/apiSchemas';

export const ingestionStatusSchema = z.enum(['OK', 'DELAYED', 'FAILING', 'QUARANTINED', 'IDLE']);
export type IngestionStatus = z.infer<typeof ingestionStatusSchema>;

export const ingestionSourceSchema = z.object({
  source: z.string(),
  status: ingestionStatusSchema,
  expectedEveryMinutes: z.number().nullable().optional(),
  lastSuccessAt: isoSchema.nullable().optional(),
  /** UUID do ingestion_run (desde a V3); a versão anterior do contrato dizia número. */
  lastRunId: z.string().nullable().optional(),
  lastError: z.string().nullable().optional(),
  rowsLast24h: z.number().optional(),
});
export type IngestionSource = z.infer<typeof ingestionSourceSchema>;

export const userSummarySchema = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  /** Nulo nos usuários criados antes da V19. */
  email: z.string().nullable().optional(),
  role: roleSchema,
  active: z.boolean(),
  lastLoginAt: isoSchema.nullable().optional(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const userPageSchema = pageOf(userSummarySchema);
export type UserPage = z.infer<typeof userPageSchema>;

/** Item de GET /api/admin/ingestion/runs (IngestionRunView). Só `id` é obrigatório; o resto o backend pode omitir. */
export const ingestionRunSchema = z
  .object({
    id: z.string(),
    source: z.string().nullable().optional(),
    kind: z.string().nullable().optional(),
    mode: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    startedAt: isoSchema.nullable().optional(),
    finishedAt: isoSchema.nullable().optional(),
    intervalStart: isoSchema.nullable().optional(),
    intervalEnd: isoSchema.nullable().optional(),
    fetched: z.number().nullable().optional(),
    valid: z.number().nullable().optional(),
    quarantined: z.number().nullable().optional(),
    obsInserted: z.number().nullable().optional(),
    gaps: z.number().nullable().optional(),
    errorSummary: z.string().nullable().optional(),
  })
  .passthrough();
export type IngestionRun = z.infer<typeof ingestionRunSchema>;
export const ingestionRunPageSchema = pageOf(ingestionRunSchema);
export type IngestionRunPage = z.infer<typeof ingestionRunPageSchema>;

/** Item de GET /api/admin/ingestion/check-integrity (DataHealthReportDTO). */
export const dataHealthSchema = z
  .object({
    slug: z.string(),
    totalWeatherRecords: z.number(),
    totalSensorRecords: z.number(),
    totalFloodEvents: z.number(),
    status: z.string(),
  })
  .passthrough();
export type DataHealth = z.infer<typeof dataHealthSchema>;

/** Corpo de PATCH /api/admin/users/{id}. Pelo menos um campo; "" em email/name limpa. */
export const userPatchSchema = z
  .object({
    role: roleSchema.optional(),
    active: z.boolean().optional(),
    email: z.string().email().or(z.literal('')).optional(),
    name: z.string().max(255).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Informe ao menos um campo.' });
export type UserPatch = z.infer<typeof userPatchSchema>;

/** Resposta de POST /api/admin/invites. */
export const inviteSchema = z.object({ token: z.string(), role: roleSchema, expiresAt: isoSchema });
export type Invite = z.infer<typeof inviteSchema>;
