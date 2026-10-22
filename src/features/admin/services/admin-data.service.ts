import api from '@/lib/api';
import { z } from 'zod';
import {
  dataHealthSchema, ingestionRunPageSchema, ingestionSourceSchema, inviteSchema, userPageSchema, userSummarySchema,
  type DataHealth, type IngestionRunPage, type IngestionSource, type Invite, type UserPage, type UserPatch, type UserSummary,
} from '../schemas/admin.schema';
import type { Role } from '@/lib/apiSchemas';

export interface RunFilter { source?: string; status?: string; page?: number; size?: number }

export const adminDataService = {
  async ingestionSources(): Promise<IngestionSource[]> {
    const { data } = await api.get<unknown>('/api/admin/ingestion/sources');
    return z.array(ingestionSourceSchema).parse(data);
  },
  async ingestionRuns({ source, status, page = 0, size = 20 }: RunFilter = {}): Promise<IngestionRunPage> {
    const { data } = await api.get<unknown>('/api/admin/ingestion/runs', { params: { source: source || undefined, status: status || undefined, page, size } });
    return ingestionRunPageSchema.parse(data);
  },
  /** Relatório de integridade por ponto (leitura; pode demorar). */
  async checkIntegrity(): Promise<DataHealth[]> {
    const { data } = await api.get<unknown>('/api/admin/ingestion/check-integrity');
    return z.array(dataHealthSchema).parse(data);
  },
  async users(page = 0, size = 20): Promise<UserPage> {
    const { data } = await api.get<unknown>('/api/admin/users', { params: { page, size } });
    return userPageSchema.parse(data);
  },
  /** Trocar perfil, ativar/desativar, editar e-mail e nome. Perfil e ativação não valem para si mesmo (409). */
  async patchUser(id: number, patch: UserPatch): Promise<UserSummary> {
    const { data } = await api.patch<unknown>(`/api/admin/users/${id}`, patch);
    return userSummarySchema.parse(data);
  },
  /** Convite de uso único (72 h) com perfil pré-definido; o link é mostrado ao ADMIN para copiar. */
  async createInvite(role: Role, email?: string | null): Promise<Invite> {
    const { data } = await api.post<unknown>('/api/admin/invites', { role, email: email || null });
    return inviteSchema.parse(data);
  },
};
