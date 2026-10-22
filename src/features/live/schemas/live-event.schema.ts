import { z } from 'zod';
import { isoSchema } from '@/lib/apiSchemas';
import { predictionSummarySchema, riskSummarySchema, type PredictionSummary, type RiskSummary } from '@/features/points/schemas/prediction.schema';
import { alertSchema, type Alert } from '@/features/alerts/schemas/alert.schema';
import { sensorReadingEventSchema, type SensorReadingEvent } from '@/features/sensors/schemas/sensor.schema';

/** Eventos do /api/stream (ADR 0012). `alert` só chega para OPERADOR e ADMIN (ADR 0010). */
export const heartbeatSchema = z.object({ at: isoSchema.optional() }).passthrough();

export type LiveEvent =
  | { type: 'risk-summary'; data: RiskSummary }
  | { type: 'prediction'; data: PredictionSummary }
  | { type: 'sensor'; data: SensorReadingEvent }
  | { type: 'alert'; data: Alert }
  | { type: 'heartbeat'; at: string | null };

const PAYLOADS = {
  'risk-summary': riskSummarySchema,
  prediction: predictionSummarySchema,
  sensor: sensorReadingEventSchema,
  alert: alertSchema,
} as const;

/** Converte uma mensagem SSE em evento tipado. Tipo desconhecido ou payload fora do contrato vira null. */
export function parseLiveEvent(msg: { event?: string; data: string }): LiveEvent | null {
  try {
    if (msg.event === 'heartbeat') {
      const r = heartbeatSchema.safeParse(msg.data ? JSON.parse(msg.data) : {});
      return r.success ? { type: 'heartbeat', at: r.data.at ?? null } : null;
    }
    const schema = PAYLOADS[msg.event as keyof typeof PAYLOADS];
    if (!schema) return null;
    const r = schema.safeParse(JSON.parse(msg.data));
    if (!r.success) return null;
    return { type: msg.event, data: r.data } as LiveEvent;
  } catch {
    return null;
  }
}
