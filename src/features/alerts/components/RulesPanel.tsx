import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { QueryState } from '@/components/ui/query-state';
import { actionErrorMessage } from '@/lib/apiError';
import { formatRecife } from '@/features/map/utils/datetime';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useAlertRules, useDeleteRule, useSaveRule } from '../hooks/useAlertRules';
import type { AlertRule, AlertRuleInput } from '../schemas/alert.schema';
import { RULE_KINDS } from '../utils/ruleKinds';
import { RuleFormDialog } from './RuleFormDialog';

type NoticeFn = (kind: 'success' | 'error' | 'info', message: string) => unknown;

const targetText = (r: AlertRule, names: Map<string, string>): string => {
  if (r.floodPointSlug) return names.get(r.floodPointSlug) ?? r.floodPointSlug;
  if (r.stationId) return `Estação ${r.stationId}`;
  return RULE_KINDS[r.kind].target === 'station' ? 'Todas as estações' : 'Todos os pontos';
};

const limitText = (r: AlertRule): string => {
  const info = RULE_KINDS[r.kind];
  if (info.usesMinRisk) return r.minRisk === 'MEDIUM' ? 'Moderado ou acima' : r.minRisk === 'HIGH' ? 'Alto' : '—';
  if (info.unit) return r.threshold != null ? `${r.threshold.toLocaleString('pt-BR')} ${info.unit}` : '—';
  return '—';
};

/** Lista e CRUD das regras de alerta (OPERADOR e ADMIN). */
export const RulesPanel: React.FC<{ notify: NoticeFn }> = ({ notify }) => {
  const rules = useAlertRules();
  const points = useFloodPoints();
  const save = useSaveRule();
  const del = useDeleteRule();
  const [editing, setEditing] = useState<AlertRule | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AlertRule | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const names = new Map((points.data ?? []).map((p) => [p.slug, p.name]));

  const doSave = (input: AlertRuleInput) => {
    setFormError(null);
    save.mutate(
      { id: editing && editing !== 'new' ? editing.id : undefined, input },
      {
        onSuccess: () => {
          notify('success', 'Regra salva.');
          setEditing(null);
        },
        onError: (e) => setFormError(actionErrorMessage(e, 'salvar a regra')),
      },
    );
  };

  const toggle = (r: AlertRule) => {
    const { id, createdBy, createdAt, updatedAt, ...rest } = r;
    void createdBy; void createdAt; void updatedAt;
    save.mutate({ id, input: { ...rest, enabled: !r.enabled } }, {
      onSuccess: () => notify('success', r.enabled ? 'Regra desativada.' : 'Regra ativada.'),
      onError: (e) => notify('error', actionErrorMessage(e, 'alterar a regra')),
    });
  };

  return (
    <section aria-label="Regras de alerta" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-prose text-body text-muted-foreground">Regras decidem quando um alerta nasce. O alerta só é criado na entrada no nível, não a cada ciclo. Limiares de risco ainda dependem da Defesa Civil.</p>
        <Button type="button" className="h-11 gap-1.5 px-4 md:h-8" onClick={() => { setFormError(null); setEditing('new'); }}>
          <Plus className="size-4" aria-hidden="true" /> Nova regra
        </Button>
      </div>
      <QueryState query={rules} what="as regras" emptyTitle="Nenhuma regra cadastrada." emptyHint="Crie uma regra para começar a receber alertas.">
        {(list) => (
          <ul className="flex flex-col gap-2">
            {list.map((r) => (
              <li key={r.id} data-rule-id={r.id} data-enabled={r.enabled} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-strong text-foreground">{RULE_KINDS[r.kind].label}</p>
                  <p className="text-caption text-muted-foreground">{targetText(r, names)} · {limitText(r)}{r.thresholdSource ? ` · fonte: ${r.thresholdSource}` : ''}</p>
                  <p className="text-caption text-muted-foreground">Criada por {r.createdBy} em {formatRecife(r.createdAt) ?? '—'}</p>
                </div>
                <label className="flex min-h-11 items-center gap-2 text-body text-foreground">
                  <input type="checkbox" role="switch" checked={r.enabled} disabled={save.isPending} onChange={() => toggle(r)} className="size-4" aria-label={`Regra ${RULE_KINDS[r.kind].label} ativa`} />
                  {r.enabled ? 'Ativa' : 'Desativada'}
                </label>
                <Button type="button" variant="outline" className="h-11 w-11 p-0 md:h-8 md:w-8" aria-label={`Editar regra ${RULE_KINDS[r.kind].label}`} onClick={() => { setFormError(null); setEditing(r); }}><Pencil className="size-4" aria-hidden="true" /></Button>
                <Button type="button" variant="outline" className="h-11 w-11 p-0 md:h-8 md:w-8" aria-label={`Excluir regra ${RULE_KINDS[r.kind].label}`} onClick={() => setDeleting(r)}><Trash2 className="size-4" aria-hidden="true" /></Button>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      {editing && (
        <RuleFormDialog
          key={editing === 'new' ? 'new' : editing.id}
          rule={editing === 'new' ? undefined : editing}
          points={(points.data ?? []).map((p) => ({ slug: p.slug, name: p.name }))}
          saving={save.isPending}
          error={formError}
          onSave={doSave}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DialogPanel title="Excluir regra?" description="Alertas já disparados por esta regra continuam na lista." onClose={() => setDeleting(null)}>
          <p className="text-body text-foreground">{RULE_KINDS[deleting.kind].label} · {targetText(deleting, names)}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 px-4 md:h-8"
              disabled={del.isPending}
              onClick={() => del.mutate(deleting.id, {
                onSuccess: () => { notify('success', 'Regra excluída.'); setDeleting(null); },
                onError: (e) => { notify('error', actionErrorMessage(e, 'excluir a regra')); setDeleting(null); },
              })}
            >
              {del.isPending ? 'Excluindo…' : 'Excluir regra'}
            </Button>
          </div>
        </DialogPanel>
      )}
    </section>
  );
};
