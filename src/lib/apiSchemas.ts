import { z } from 'zod';

/** Peças compartilhadas dos contratos novos (redesign-telas.yaml). Tipos saem de z.infer. */
export { riskLevelSchema, modelValidationStatusSchema, degradationReasonSchema } from '@/features/map/schemas/floodPointResponse.schema';

/** ISO 8601 UTC. A conversão para America/Recife acontece só na exibição. */
export const isoSchema = z.string();

export const roleSchema = z.enum(['USER', 'OPERADOR', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const severitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type Severity = z.infer<typeof severitySchema>;

export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({ page: z.number(), size: z.number(), totalElements: z.number(), content: z.array(item) });
