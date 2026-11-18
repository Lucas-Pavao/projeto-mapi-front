import React from 'react';
import { cn } from '@/lib/utils';
import type { SourceKind } from './sourceKinds';

interface Tag { label: string; hint: string; cls: string; dashed?: boolean; upper?: boolean }

const WARN = 'border-warning/60 bg-warning/10 text-warning';
const PRIMARY = 'border-primary/50 bg-primary/10 text-primary';

/** Uma linha por etiqueta do canvas (Cenarios1Selos): cor, texto e tracejado. */
const TAGS: Record<SourceKind, Tag> = {
  MEASURED: { label: 'medida · Cemaden', hint: 'Pluviômetro Cemaden, regra da chuva do ponto', cls: PRIMARY },
  LIVE: { label: 'ao vivo', hint: 'Cemaden, leitura em tempo real', cls: 'border-primary/50 text-primary', upper: true },
  PED: { label: 'PED', hint: 'Cemaden PED, série validada', cls: 'border-success/60 text-success', upper: true },
  PED_ONLY: { label: 'só PED', hint: 'Estação que só existe no PED (sem leitura ao vivo)', cls: 'border-warning/60 text-warning', upper: true, dashed: true },
  ESTIMATED: { label: 'estimada · Open-Meteo', hint: 'Open-Meteo: só quando não há estação válida no raio', cls: 'border-warning text-warning', dashed: true },
  NO_DATA: { label: 'sem dado', hint: 'Lacuna: não vira zero', cls: 'border-warning text-warning', dashed: true },
  FORECAST: { label: 'prevista · estimativa', hint: 'rain_v1: faixa entre quantis, nunca número único', cls: 'border-muted-foreground text-muted-foreground', dashed: true },
  TIDE_HARMONIC: { label: 'maré · reserva harmônica', hint: 'Previsão harmônica, sem tábua oficial do ano', cls: 'border-sand bg-sand/10 text-sand' },
  OFFICIAL_INMET: { label: 'oficial · INMET', hint: 'Aviso vigente; não é previsão do MAPi', cls: WARN },
  PHYSICAL_MODEL: { label: 'modelo físico · não validado', hint: 'Nível do ponto pelo modelo físico', cls: WARN },
  TESTING: { label: 'Em teste: não é alerta oficial', hint: 'Modo sombra do alerta', cls: WARN },
  SYNTHETIC_LABEL: { label: 'rótulo SINTÉTICO', hint: 'Aba Experimental (logreg_v3)', cls: WARN },
};

interface Props {
  kind: SourceKind;
  /** Texto mais específico que o padrão da variante (ex.: "sem dado · Cemaden"); a cor e o tracejado continuam os da variante. */
  label?: string;
  className?: string;
  'data-testid'?: string;
}

/** Etiqueta de origem do dado (12 variantes). Texto sempre visível (cor não é o único sinal); tracejada onde o canvas tracejar. */
export const SourceTag: React.FC<Props> = ({ kind, label, className, 'data-testid': testId }) => {
  const t = TAGS[kind];
  return (
    <span title={t.hint} data-source={kind} data-testid={testId} data-dashed={t.dashed ? 'true' : undefined}
      className={cn('inline-flex h-[18px] items-center whitespace-nowrap rounded border px-1.5 text-[10px] font-bold leading-none tracking-wide', t.upper && 'uppercase', t.dashed && 'border-dashed', t.cls, className)}>
      {label ?? t.label}
    </span>
  );
};
