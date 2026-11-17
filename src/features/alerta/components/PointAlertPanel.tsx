import React from 'react';
import { CloudRain, Droplets, FlaskConical, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertaPonto } from '../schemas/alerta.schema';
import { PHYSICAL_MODEL_LABEL, ageText, floodBand, floodMessage, rainMessage, rainTitle } from '../utils/alertaText';

interface Props {
  alerta: AlertaPonto | null | undefined;
  pointName: string;
  isLoading?: boolean;
  /** Falha ao ler o alerta (rede, 5xx): estado próprio, nunca "sem alerta". */
  isError?: boolean;
}

const tone: Record<AlertaPonto['rainAlert'], string> = {
  ALERTA: 'border-destructive/60 bg-destructive/10 text-destructive',
  ATENCAO: 'border-warning/60 bg-warning/10 text-warning',
  NENHUM: 'border-border bg-muted text-foreground',
  SEM_DADO: 'border-dashed border-muted-foreground/50 bg-muted text-muted-foreground',
};

/** Destaque do cartão do ponto: o estado do alerta (ADR 0026). Apresentação pura. */
export const PointAlertPanel: React.FC<Props> = ({ alerta, pointName, isLoading = false, isError = false }) => {
  if (isLoading) return <p className="m-0 text-xs text-muted-foreground" data-testid="alerta-loading">Lendo o alerta…</p>;
  if (isError || !alerta) {
    return (
      <div data-testid="alerta-sem-dado" className={cn('rounded-lg border p-2.5 text-xs', tone.SEM_DADO)}>
        <p className="m-0 flex items-center gap-1.5 font-bold"><HelpCircle className="size-3.5" aria-hidden="true" /> Sem dado suficiente agora</p>
        <p className="m-0">{isError ? 'Não foi possível ler o alerta.' : 'O alerta deste ponto ainda não foi calculado.'}</p>
      </div>
    );
  }
  const age = ageText(alerta);
  const band = floodBand(alerta);
  return (
    <div className="flex flex-col gap-2" data-testid="alerta-panel">
      {alerta.shadow && (
        <p data-testid="alerta-em-teste" className="m-0 inline-flex items-center gap-1.5 self-start rounded-md border border-warning/50 bg-warning/10 px-2 py-0.5 text-[11px] font-bold text-warning">
          <FlaskConical className="size-3" aria-hidden="true" /> Em teste: não é alerta oficial
        </p>
      )}
      <div data-testid={`alerta-rain-${alerta.rainAlert}`} className={cn('rounded-lg border p-2.5', tone[alerta.rainAlert])}>
        <p className="m-0 flex items-center gap-1.5 text-sm font-bold"><CloudRain className="size-4" aria-hidden="true" /> {rainTitle(alerta)}</p>
        <p className="m-0 text-[13px] leading-[18px] text-foreground">{rainMessage(alerta, pointName)}</p>
        <p className="m-0 mt-1 text-[11px] text-muted-foreground">
          Chuva medida nos últimos 10 min: <span className="font-mono">{alerta.rainTeMm != null ? `${alerta.rainTeMm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm` : '—'}</span>
          {age ? ` · ${age}` : ''}
        </p>
      </div>
      <div data-testid={`alerta-flood-${alerta.pointFlood}`} className={cn('rounded-lg border p-2.5',
        alerta.pointFlood === 'PROVAVEL' ? 'border-destructive/60 bg-destructive/10' : alerta.pointFlood === 'SEM_DADO' ? tone.SEM_DADO : 'border-border bg-card')}>
        <p className="m-0 flex items-center gap-1.5 text-[13px] font-bold"><Droplets className="size-4" aria-hidden="true" />
          {alerta.pointFlood === 'PROVAVEL' ? 'Alagamento provável' : 'Nível do ponto'}
        </p>
        <p className="m-0 text-[13px] leading-[18px]">{floodMessage(alerta, pointName)}</p>
        {alerta.pointFlood !== 'SEM_DADO' && band && <p className="m-0 text-[11px] text-muted-foreground">{band}</p>}
        <p data-testid="alerta-modelo-fisico" className="m-0 mt-1 inline-flex items-center gap-1 rounded border border-warning/50 bg-warning/10 px-1.5 py-0.5 text-[11px] font-bold text-warning">
          {alerta.physicalModelLabel ?? PHYSICAL_MODEL_LABEL}
        </p>
      </div>
      <p className="m-0 text-[10px] text-muted-foreground">
        {alerta.rainModelVersion ?? 'rain_v1'} · {alerta.bucketVersion ?? 'balde'} · TR {alerta.trYears ?? 5} anos · {alerta.attribution ?? 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC'}
      </p>
    </div>
  );
};
