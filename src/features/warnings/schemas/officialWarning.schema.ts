import { z } from 'zod';

/** Aviso meteorológico oficial vigente do INMET (ADR 0024). */
export const officialWarningSchema = z.object({
  warningId: z.number(),
  sequenceId: z.number(),
  externalId: z.number().nullable().optional(),
  capCode: z.string().nullable().optional(),
  source: z.string(),
  firstSeenAt: z.string(),
  lastSeenAt: z.string(),
  validFrom: z.string(),
  validTo: z.string(),
  severity: z.string(),
  severityId: z.number().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  risks: z.array(z.string()).default([]),
  instructions: z.array(z.string()).default([]),
  geocodes: z.array(z.string()).default([]),
  municipalities: z.string().nullable().optional(),
  altered: z.boolean().default(false),
  closed: z.boolean().default(false),
});

export const officialWarningsResponseSchema = z.object({
  source: z.string(),
  attribution: z.string(),
  emissionNote: z.string(),
  referenceTimeUtc: z.string(),
  warnings: z.array(officialWarningSchema),
});

export type OfficialWarning = z.infer<typeof officialWarningSchema>;
export type OfficialWarningsResponse = z.infer<typeof officialWarningsResponseSchema>;
