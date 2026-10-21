import React from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { degradationText, showsExperimentalLabel } from '@/components/risk/risk';
import { formatRecife } from '@/features/map/utils/datetime';
import { cn } from '@/lib/utils';
import type { Alert, AlertSeverity } from '../schemas/alert.schema';
import { ALERT_KIND_LABEL } from '../utils/ruleKinds';

// Severidade do alerta (INFO/WARNING/CRITICAL) não é classe de risco: usa tokens de sistema e ícone próprio.
const SEVERITY = {
  INFO: { label: 'Informação', Icon: Info, tone: 'text-info border-info/40 bg-info/10' },
  WARNING: { label: 'Atenção', Icon: TriangleAlert, tone: 'text-warning border-warning/40 bg-warning/10' },
  CRITICAL: { label: 'Crítico', Icon: OctagonAlert, tone: 'text-destructive border-destructive/40 bg-destructive/10' },
} satisfies Record<AlertSeverity, { label: string; Icon: React.ComponentType<{ className?: string }>; tone: string }>;

interface Props {
  alert: Alert;
  canAck: boolean;
  acking: boolean;
  onAck: (id: number) => void;
}

export const AlertItem: React.FC<Props> = ({ alert: a, canAck, acking, onAck }) => {
  const sev = SEVERITY[a.severity];
  const open = !a.acknowledgedAt;
  return (
    <li data-alert-id={a.id} data-open={open} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-2xs font-bold', sev.tone)}>
          <sev.Icon className="size-3.5" /> {sev.label}
        </span>
        <span className="text-caption text-muted-foreground">{ALERT_KIND_LABEL(a.kind)}</span>
        <span className="ml-auto text-caption text-muted-foreground">{formatRecife(a.triggeredAt) ?? '—'}</span>
      </div>
      <p className="text-title text-foreground">{a.title}</p>
      {a.detail && <p className="text-body text-muted-foreground">{a.detail}</p>}
      {(a.riskLevel || a.observedValue != null) && (
        <div className="flex flex-wrap items-center gap-2">
          {a.riskLevel && <RiskBadge level={a.riskLevel} />}
          {a.riskLevel && showsExperimentalLabel({ riskLevel: a.riskLevel, modelValidationStatus: a.modelValidationStatus }) && <ExperimentalBadge />}
          {a.riskLevel === 'UNKNOWN' && <span className="text-caption text-muted-foreground">Motivo: {degradationText(a.degradationReason)}. Isto não é queda de risco.</span>}
          {a.observedValue != null && <span className="text-reading text-foreground">valor observado {a.observedValue.toLocaleString('pt-BR')}</span>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-muted-foreground">
        {a.floodPointSlug && <Link to={`/pontos/${a.floodPointSlug}`} className="font-semibold text-primary hover:underline">Ponto {a.floodPointSlug}</Link>}
        {a.stationId && <span>Estação <span className="text-code">{a.stationId}</span></span>}
        {open ? (
          canAck && (
            <Button type="button" className="ml-auto h-11 px-4 md:h-8" disabled={acking} onClick={() => onAck(a.id)} aria-label={`Reconhecer alerta: ${a.title}`}>
              {acking ? 'Reconhecendo…' : 'Reconhecer'}
            </Button>
          )
        ) : (
          <span className="ml-auto flex items-center gap-1 text-success">
            <CircleCheck className="size-4" aria-hidden="true" /> Reconhecido por {a.acknowledgedBy ?? 'operador'} em {formatRecife(a.acknowledgedAt) ?? '—'}
          </span>
        )}
      </div>
    </li>
  );
};
