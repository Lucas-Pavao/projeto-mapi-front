import React from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryState } from '@/components/ui/query-state';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { showsExperimentalLabel } from '@/components/risk/risk';
import { formatRecife } from '@/features/map/utils/datetime';

export const AlertsPage: React.FC = () => {
  const query = useAlerts('OPEN');
  return (
    <PageShell title="Alertas" description="Alertas abertos disparados pelas regras. Reconhecer e editar regras chega na F2.">
      <QueryState query={query} what="alertas" isEmpty={(d) => d.content.length === 0} emptyTitle="Nenhum alerta aberto." emptyHint="Quando uma regra disparar, o alerta aparece aqui.">
        {(page) => (
          <ul className="space-y-2">
            {page.content.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-foreground">{a.title}</p>
                  {a.detail && <p className="text-sm text-muted-foreground">{a.detail}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Disparado às {formatRecife(a.triggeredAt) ?? '—'}</p>
                </div>
                {a.riskLevel && (
                  <div className="flex flex-col items-start gap-1">
                    <RiskBadge level={a.riskLevel} />
                    {showsExperimentalLabel({ riskLevel: a.riskLevel, modelValidationStatus: a.modelValidationStatus }) && <ExperimentalBadge />}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </PageShell>
  );
};
export default AlertsPage;
