import React from 'react';
import { CloudRain, Droplets, FlaskConical, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertaPonto } from '../schemas/alerta.schema';
import { pctTxt } from '@/components/risk/thresholds';
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

const SPAN = 268;
const FLOOD_CM = 15;

/** Barra de P(FORTE em 1 h) com marca no limiar de ligar que a API enviou (`probOn`); sem limiar, sem marca. */
const ProbBar: React.FC<{ prob: number; probOn: number | null | undefined }> = ({ prob, probOn }) => {
  const max = Math.max(0.6, prob, probOn ?? 0);
  return (
    <div className="mt-1.5" data-testid="alerta-prob">
      <div className="relative h-2 rounded-full bg-muted">
        <span className="absolute inset-y-0 left-0 rounded-full bg-current" style={{ width: `${Math.min(100, (prob / max) * 100)}%` }} />
        {probOn != null && <span data-testid="alerta-prob-on" className="absolute -inset-y-[3px] w-0.5 bg-foreground" style={{ left: `${Math.min(100, (probOn / max) * 100)}%` }} />}
      </div>
      <div className="flex justify-between font-mono text-[10px] leading-[14px] text-muted-foreground">
        <span>P(FORTE em 1 h) {pctTxt(prob)}</span>
        {probOn != null && <span>liga ≥ {pctTxt(probOn)}</span>}
      </div>
    </div>
  );
};

/** Régua do balde: lâmina agora, faixa da mediana (q50) até q80 em 60 min e a linha de alagamento (15 cm). */
const BucketRule: React.FC<{ a: AlertaPonto; hNowCm: number; }> = ({ a, hNowCm }) => {
  const q50 = a.hProjQ50MaxCm ?? null;
  const q80 = a.hProjQ80MaxCm ?? q50;
  const max = Math.max(40, hNowCm, q80 ?? 0, FLOOD_CM * 1.2);
  const x = (v: number) => Math.min(SPAN, (Math.max(0, v) / max) * SPAN);
  const c = (v: number | null | undefined) => (v == null ? '—' : Math.round(v).toLocaleString('pt-BR'));
  const band = q50 != null && q80 != null ? `projeção em 60 min de ${c(q50)} a ${c(q80)} cm` : 'sem projeção';
  const aria = `Lâmina agora ${c(hNowCm)} cm, ${band}; alagamento a partir de ${FLOOD_CM} cm`;
  return (
    <svg data-testid="alerta-balde" viewBox={`0 0 ${SPAN} 40`} role="img" aria-label={aria} className="mt-1.5 block h-10 w-full">
      <rect x="0" y="14" width={SPAN} height="12" rx="6" className="fill-muted" />
      {q50 != null && q80 != null && <rect x={x(q50)} y="14" width={Math.max(0, x(q80) - x(q50))} height="12" className="fill-risk-high opacity-20" />}
      <rect x="0" y="14" width={x(hNowCm)} height="12" rx="6" className="fill-primary" />
      {q50 != null && <line x1={x(q50)} x2={x(q50)} y1="10" y2="30" className="stroke-foreground" strokeWidth="2" />}
      <line x1={x(FLOOD_CM)} x2={x(FLOOD_CM)} y1="6" y2="34" className="stroke-risk-high-edge" strokeWidth="2" strokeDasharray="3 2" />
      <text x={x(FLOOD_CM)} y="6" textAnchor="middle" className="fill-risk-high-text font-mono text-[9px] font-bold">{FLOOD_CM} cm</text>
      <text x="0" y="39" className="fill-muted-foreground font-mono text-[9px]">agora {c(hNowCm)} cm</text>
      {q50 != null && q80 != null && <text x={SPAN} y="39" textAnchor="end" className="fill-muted-foreground font-mono text-[9px]">em 60 min: {c(q50)} a {c(q80)} cm</text>}
    </svg>
  );
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
        <p className="m-0 flex items-center gap-1.5 text-[13px] font-bold"><CloudRain className="size-4" aria-hidden="true" /> {rainTitle(alerta)}</p>
        <p className="m-0 text-[13px] leading-[18px] text-foreground">{rainMessage(alerta, pointName)}</p>
        <p className="m-0 mt-1 text-[11px] text-muted-foreground">
          Chuva medida nos últimos 10 min: <span className="font-mono">{alerta.rainTeMm != null ? `${alerta.rainTeMm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mm` : '—'}</span>
          {age ? ` · ${age}` : alerta.rainTeMm == null ? ' · nenhuma leitura válida' : ''}
        </p>
        {alerta.probForte1h != null && <ProbBar prob={alerta.probForte1h} probOn={alerta.probOn} />}
      </div>
      <div data-testid={`alerta-flood-${alerta.pointFlood}`} className={cn('rounded-lg border p-2.5',
        alerta.pointFlood === 'PROVAVEL' ? 'border-destructive/60 bg-destructive/10' : alerta.pointFlood === 'SEM_DADO' ? tone.SEM_DADO : 'border-border bg-card')}>
        <p className="m-0 flex items-center gap-1.5 text-[13px] font-bold"><Droplets className="size-4" aria-hidden="true" />
          {alerta.pointFlood === 'PROVAVEL' ? 'Alagamento provável' : 'Nível do ponto'}
        </p>
        <p className="m-0 text-[13px] leading-[18px]">{floodMessage(alerta, pointName)}</p>
        {alerta.pointFlood !== 'SEM_DADO' && band && <p className="sr-only">{band}</p>}
        {alerta.pointFlood !== 'SEM_DADO' && alerta.hNowCm != null && <BucketRule a={alerta} hNowCm={alerta.hNowCm} />}
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
