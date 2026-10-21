import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';
import { riskSummarySchema } from '@/features/points/schemas/prediction.schema';

/** Eventos do /api/stream (ADR 0012) já usados no cliente. prediction, sensor e alert entram quando as telas os consumirem. */
export const heartbeatSchema = z.object({ at: isoSchema.optional() }).passthrough();

export type LiveEvent =
  | { type: 'risk-summary'; data: z.infer<typeof riskSummarySchema> }
  | { type: 'heartbeat'; at: string | null };

/** Converte uma mensagem SSE em evento tipado. Tipo desconhecido ou payload fora do contrato vira null. */
export function parseLiveEvent(msg: { event?: string; data: string }): LiveEvent | null {
  try {
    if (msg.event === 'risk-summary') {
      const r = riskSummarySchema.safeParse(JSON.parse(msg.data));
      return r.success ? { type: 'risk-summary', data: r.data } : null;
    }
    if (msg.event === 'heartbeat') {
      const r = heartbeatSchema.safeParse(msg.data ? JSON.parse(msg.data) : {});
      return r.success ? { type: 'heartbeat', at: r.data.at ?? null } : null;
    }
  } catch {
    return null;
  }
  return null;
}
