import React from 'react';
import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/InfoTip';
import type { AlagamentoPonto } from '../schemas/alagamento.schema';
import {
  BAR_CLASS, CHIP_CLASS, DOT_CLASS, HCRIT_CM, INFO, fmt1, floodChipOf, pctOfBar, rainSourceLine, rangeCm,
} from '../utils/alagamentoText';

/** Selo do nível com ⓘ (prancha "Nível 6"). Texto sempre visível; o motivo completo fica no ⓘ. */
export const FloodChip: React.FC<{ ponto: AlagamentoPonto; className?: string }> = ({ ponto, className }) => {
  const chip = floodChipOf(ponto);
  return (
    <span data-testid="flood-chip" data-level={ponto.level}
      className={cn('inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-sm font-bold', CHIP_CLASS[chip.tone],
        chip.dashed && 'border-dashed', className)}>
      <span aria-hidden="true" className={cn('size-2 rounded-full', DOT_CLASS[chip.tone])} />
      {chip.label}
      <InfoTip text={chip.info} side="bottom" />
    </span>
  );
};

const Metric: React.FC<{ label: string; info: string; value: React.ReactNode; sub?: React.ReactNode; testId: string }> = ({ label, info, value, sub, testId }) => (
  <div data-testid={testId} className="min-w-0">
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">{label}<InfoTip text={info} /></div>
    <div className="mt-1 whitespace-nowrap font-mono text-2xl font-bold tabular-nums leading-tight">{value}</div>
    {sub && <div className="mt-1 truncate text-xs text-muted-foreground">{sub}</div>}
  </div>
);

/**
 * Bloco do alerta por regressão (componente `AlertaRegressao` da prancha "Nível 6"): selo, lâmina agora, chuva agora e a
 * previsão de lâmina em 1, 3 e 6 h (barra q50 cheia, q95 clara, traço de 15 cm). Enxuto: explicações só nos ⓘ.
 */
export const AlertaRegressao: React.FC<{ ponto: AlagamentoPonto; showChip?: boolean }> = ({ ponto, showChip = true }) => {
  const semDado = ponto.level === 'SEM_DADO';
  const chuvaAusente = ponto.reason === 'CHUVA_AUSENTE';
  const sheet = fmt1(ponto.hNowCm);
  const rain = fmt1(ponto.rainLastHourMm);
  return (
    <section aria-label="Alerta de alagamento por regressão" className="space-y-4">
      {showChip && <FloodChip ponto={ponto} />}
      <div className="grid grid-cols-2 gap-4">
        <Metric testId="lamina-agora" label="Lâmina agora" info={INFO.sheetNow}
          value={sheet == null ? <span className="text-lg text-muted-foreground">sem dado</span> : `${sheet} cm`} />
        <Metric testId="chuva-agora" label="Chuva agora" info={INFO.rainNow}
          value={rain == null || chuvaAusente
            ? <span className="text-lg text-warning">sem dado</span>
            : `${rain} mm/h`}
          sub={chuvaAusente ? null : rainSourceLine(ponto)} />
      </div>
      <div data-testid="previsao-lamina">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          Previsão de lâmina<InfoTip text={INFO.forecast} align="end" />
        </div>
        {semDado ? (
          <p className="mt-2 text-sm text-muted-foreground">sem previsão neste ciclo</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {ponto.horizons.map((h) => {
              const c = BAR_CLASS[h.level];
              return (
                <li key={h.hours} data-testid={`horizonte-${h.hours}`} data-level={h.level} className="grid grid-cols-[2.5rem_1fr_5.5rem] items-center gap-3">
                  <span className="font-mono text-sm font-bold">{h.hours} h</span>
                  <span className="relative h-3 rounded-full bg-secondary" role="img"
                    aria-label={`${h.hours} h: lâmina provável ${fmt1(h.sheetQ50Cm) ?? 'sem dado'} cm, pessimista ${fmt1(h.sheetQ95Cm) ?? 'sem dado'} cm; alagamento a partir de ${HCRIT_CM} cm`}>
                    <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q95)} style={{ width: `${pctOfBar(h.sheetQ95Cm)}%` }} />
                    <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q50)} style={{ width: `${pctOfBar(h.sheetQ50Cm)}%` }} />
                    <span aria-hidden="true" className="absolute -inset-y-1 w-0.5 bg-destructive" style={{ left: `${pctOfBar(HCRIT_CM)}%` }} />
                  </span>
                  <span className={cn('text-right font-mono text-sm font-bold tabular-nums', c.text)}>{rangeCm(h.sheetQ50Cm, h.sheetQ95Cm)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
