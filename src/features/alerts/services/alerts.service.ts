import api from '@/lib/api';
import { z } from 'zod';
import {
  alertPageSchema, alertRuleSchema, alertSchema,
  type Alert, type AlertPage, type AlertRule, type AlertRuleInput,
} from '../schemas/alert.schema';

export type AlertStatusFilter = 'OPEN' | 'ACKNOWLEDGED' | 'ALL';

export const alertsService = {
  async list(status: AlertStatusFilter = 'OPEN', page = 0, size = 20): Promise<AlertPage> {
    const { data } = await api.get<unknown>('/api/alerts', { params: { status, page, size } });
    return alertPageSchema.parse(data);
  },
  /** Reconhecer é idempotente: reconhecer de novo devolve o mesmo alerta. */
  async acknowledge(id: number): Promise<Alert> {
    const { data } = await api.post<unknown>(`/api/alerts/${id}/ack`);
    return alertSchema.parse(data);
  },
  async listRules(): Promise<AlertRule[]> {
    const { data } = await api.get<unknown>('/api/alert-rules');
    return z.array(alertRuleSchema).parse(data);
  },
  async createRule(input: AlertRuleInput): Promise<AlertRule> {
    const { data } = await api.post<unknown>('/api/alert-rules', input);
    return alertRuleSchema.parse(data);
  },
  async updateRule(id: number, input: AlertRuleInput): Promise<AlertRule> {
    const { data } = await api.put<unknown>(`/api/alert-rules/${id}`, input);
    return alertRuleSchema.parse(data);
  },
  /** Alertas já disparados ficam. */
  async deleteRule(id: number): Promise<void> {
    await api.delete(`/api/alert-rules/${id}`);
  },
};
