import React from 'react';
import { Link } from 'react-router-dom';
import { CloudRain, OctagonAlert, TriangleAlert, WifiOff, Waves, type LucideIcon, DatabaseZap } from 'lucide-react';
import { CHIP_CLASS, REASON_SHORT, toneOf } from '@/features/alagamento/utils/alagamentoText';
import type { FloodLevel, FloodReason } from '@/features/alagamento/schemas/alagamento.schema';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import { cn } from '@/lib/utils';
import type { Alert, AlertKind, AlertSeverity } from '../schemas/alert.schema';

// Severidade (INFO/WARNING/CRITICAL) não é classe de risco: tokens de sistema, ícone por tipo e texto para leitor de tela.
const SEVERITY: Record<AlertSeverity, { label: string; tone: string; tint: string }> = {
  INFO: { label: 'Informação', tone: 'text-chart-3', tint: 'bg-chart-3/20' },
  WARNING: { label: 'Atenção', tone: 'text-risk-moderate', tint: 'bg-risk-moderate/20' },
  CRITICAL: { label: 'Crítico', tone: 'text-risk-high-edge', tint: 'bg-risk-high/20' },
};
const ICON: Record<AlertKind, LucideIcon> = {
  RISK_LEVEL: OctagonAlert,
  PREDICTION_UNAVAILABLE: TriangleAlert,
  RIVER_STAGE: Waves,
  TIDE_ABOVE: Waves,
  RAIN_RATE: CloudRain,
  SENSOR_STALE: WifiOff,
  SOURCE_STALE: DatabaseZap,
};

const LEVEL_TEXT: Record<FloodLevel, string> = { ALERTA: 'Alerta', ATENCAO: 'Atenção', SEM_ALERTA: 'Sem alerta', SEM_DADO: 'Sem dado' };

interface Props {
  alert: Alert;
  canAck: boolean;
  acking: boolean;
  isNew?: boolean;
  onAck: (id: number) => void;
}

/** Linha da Central de alertas: ícone por tipo, título, detalhe, hora e "Ciente". Lido fica sem destaque. */
export const AlertItem: React.FC<Props> = ({ alert: a, canAck, acking, isNew = false, onAck }) => {
  const sev = SEVERITY[a.severity];
  const Icon = ICON[a.kind];
  const open = !a.acknowledgedAt;
  const detail = [
    a.detail,
    a.riskLevel === 'SEM_DADO' && a.degradationReason ? `Motivo: ${REASON_SHORT[a.degradationReason as FloodReason] ?? a.degradationReason}.` : null,
    a.observedValue != null ? `valor observado ${a.observedValue.toLocaleString('pt-BR')}` : null,
  ].filter(Boolean).join(' · ');
  return (
    <li data-alert-id={a.id} data-open={open} className={cn('flex items-start gap-3 rounded-xl p-3', open ? 'bg-muted' : 'bg-transparent')}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[10px]', sev.tint, sev.tone)}>
        <Icon className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
        <span className="sr-only">{sev.label}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cn('text-[14px] leading-5', open ? 'font-extrabold' : 'font-semibold')}>{a.title}</span>
          {isNew && open && <span className="h-[18px] rounded-full bg-primary px-1.5 text-[10px] font-bold leading-[18px] text-primary-foreground">NOVO</span>}
          {a.riskLevel && a.riskLevel in LEVEL_TEXT && (
            <span data-testid="alert-level" className={cn('inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-bold', CHIP_CLASS[toneOf(a.riskLevel as FloodLevel)])}>{LEVEL_TEXT[a.riskLevel as FloodLevel]}</span>
          )}
          {a.riskLevel && a.riskLevel in LEVEL_TEXT && <span className="inline-flex h-5 items-center rounded-md border border-warning/70 px-1.5 text-[10px] font-bold text-warning">Experimental</span>}
        </div>
        <div className="text-[12px] leading-4 text-muted-foreground">
          {detail}
          {a.floodPointSlug && <>{detail ? ' · ' : ''}<Link to={`/pontos/${a.floodPointSlug}`} className="text-primary hover:underline">Ponto {a.floodPointSlug}</Link></>}
          {a.stationId && <>{detail || a.floodPointSlug ? ' · ' : ''}Estação <span className="font-mono">{a.stationId}</span></>}
          {!open && <>{' · '}Reconhecido por {a.acknowledgedBy ?? 'operador'} às {formatHoraCurta(a.acknowledgedAt) ?? '—'}</>}
        </div>
      </div>
      <span className="font-mono text-[12px] font-semibold leading-5 text-muted-foreground">{formatHoraCurta(a.triggeredAt) ?? '—'}</span>
      {open && canAck && (
        <button
          type="button"
          disabled={acking}
          onClick={() => onAck(a.id)}
          aria-label={`Reconhecer alerta: ${a.title}`}
          className="h-11 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-[12px] font-semibold leading-4 text-foreground hover:bg-card disabled:opacity-50 md:h-7"
        >
          {acking ? 'Enviando…' : 'Ciente'}
        </button>
      )}
    </li>
  );
};
