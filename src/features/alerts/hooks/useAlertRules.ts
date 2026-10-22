import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '../services/alerts.service';
import { ALERTS_KEY } from './useAlerts';
import type { AlertRuleInput } from '../schemas/alert.schema';

export const RULES_KEY = ['alert-rules'] as const;

export const useAlertRules = () => useQuery({ queryKey: RULES_KEY, queryFn: alertsService.listRules });

/** Reconhecer alerta: ao concluir, listas de alertas são revalidadas (o pulso do mapa acompanha). */
export function useAckAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsService.acknowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALERTS_KEY }),
  });
}

/** Criar (sem id) ou substituir (com id) uma regra. */
export function useSaveRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AlertRuleInput }) => (id == null ? alertsService.createRule(input) : alertsService.updateRule(id, input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => alertsService.deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  });
}
