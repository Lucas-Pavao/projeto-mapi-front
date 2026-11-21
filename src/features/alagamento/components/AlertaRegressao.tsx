import React from 'react';
import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/InfoTip';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import type { AlagamentoPonto } from '../schemas/alagamento.schema';
import {
  BAR_CLASS, CHIP_CLASS, DOT_CLASS, HCRIT_CM, INFO, fmt1, floodChipOf, pctOfBar, rainSourceLine, rangeCm,
} from '../utils/alagamentoText';

/** Selo do nível com ⓘ (prancha "Nível 6"). Texto sempre visível; o motivo completo fica no ⓘ. */
export const FloodChip: React.FC<{ ponto: AlagamentoPonto; className?: string }> = ({ ponto, className }) => {
  const chip = floodChipOf(ponto);
  return (
    <span data-testid="flood-chip" data-level={ponto.level}
      className={cn('inline-flex min-h-7 items-center gap-1.5 rounded-full border-[1.5px] px-2.5 text-xs leading-4 font-extrabold', CHIP_CLASS[chip.tone],
        chip.dashed && 'border-dashed', className)}>
      <span aria-hidden="true" className={cn('size-2 rounded-full', DOT_CLASS[chip.tone])} />
      {chip.label}
      <InfoTip text={chip.info} side="bottom" />
    </span>
  );
};

/** Prancha: rótulo 11 px; lâmina 24 px e chuva 18 px (mono, extrabold, linha de 30 px); fonte da chuva 11 px numa linha. */
const Metric: React.FC<{ label: string; info: string; value: React.ReactNode; sub?: React.ReactNode; testId: string; big?: boolean }> = ({ label, info, value, sub, testId, big = false }) => (
  <div data-testid={testId} className="min-w-0">
    <div className="flex items-center gap-1 whitespace-nowrap text-[11px] leading-[14px] text-muted-foreground">{label}<InfoTip text={info} /></div>
    <div className={cn('whitespace-nowrap font-mono font-extrabold tabular-nums leading-[30px]', big ? 'text-2xl' : 'text-lg')}>{value}</div>
    {sub && <div className="truncate text-[11px] leading-[14px] text-muted-foreground">{sub}</div>}
  </div>
);

/** As 3 linhas "1 h / 3 h / 6 h": barra q50 cheia, q95 clara, traço de 15 cm e "17–33 cm" (com "· até 17h20" se pedido). */
export const HorizonBars: React.FC<{ horizons: AlagamentoPonto['horizons']; withValidity?: boolean; className?: string }> = ({ horizons, withValidity = false, className }) => (
  <ul className={cn('m-0 flex list-none flex-col gap-1.5 p-0', className)}>
    {horizons.map((h) => {
      const c = BAR_CLASS[h.level];
      return (
        <li key={h.hours} data-testid={`horizonte-${h.hours}`} data-level={h.level} className={cn('grid items-center gap-2', withValidity ? 'grid-cols-[30px_1fr_9.5rem]' : 'grid-cols-[30px_1fr_74px]')}>
          <span className="font-mono text-xs leading-4 font-bold">{h.hours} h</span>
          <span className="relative h-2.5 rounded-full bg-muted" role="img"
            aria-label={`${h.hours} h: lâmina provável ${fmt1(h.sheetQ50Cm) ?? 'sem dado'} cm, pessimista ${fmt1(h.sheetQ95Cm) ?? 'sem dado'} cm; alagamento a partir de ${HCRIT_CM} cm`}>
            <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q95)} style={{ width: `${pctOfBar(h.sheetQ95Cm)}%` }} />
            <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q50)} style={{ width: `${pctOfBar(h.sheetQ50Cm)}%` }} />
            <span aria-hidden="true" className="absolute -inset-y-1 w-0.5 bg-destructive" style={{ left: `${pctOfBar(HCRIT_CM)}%` }} />
          </span>
          <span className={cn('text-right font-mono text-xs leading-4 font-bold tabular-nums', c.text)}>
            {rangeCm(h.sheetQ50Cm, h.sheetQ95Cm)}{withValidity && h.validUntil ? <span className="font-normal text-muted-foreground"> · até {formatHoraCurta(h.validUntil)}</span> : null}
          </span>
        </li>
      );
    })}
  </ul>
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
    <section aria-label="Alerta de alagamento por regressão" className="flex flex-col gap-3">
      {showChip && <FloodChip ponto={ponto} />}
      <div className="grid grid-cols-2 gap-2">
        <Metric big testId="lamina-agora" label="Lâmina agora" info={INFO.sheetNow}
          value={sheet == null ? <span className="text-muted-foreground">—</span> : `${sheet} cm`} />
        <Metric testId="chuva-agora" label="Chuva agora" info={INFO.rainNow}
          value={rain == null || chuvaAusente
            ? <span className="text-warning">sem dado</span>
            : `${rain} mm/h`}
          sub={chuvaAusente ? null : rainSourceLine(ponto)} />
      </div>
      <div data-testid="previsao-lamina">
        <div className="flex items-center justify-between text-[11px] leading-[14px] text-muted-foreground">
          Previsão de lâmina<InfoTip text={INFO.forecast} align="end" />
        </div>
        {semDado ? (
          // Prancha: as três linhas ficam, com a barra vazia e "—"; sem dado nunca vira 0 cm.
          <ul data-testid="previsao-sem-dado" aria-label="sem previsão neste ciclo" className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
            {[1, 3, 6].map((h) => (
              <li key={h} className="grid grid-cols-[30px_1fr_74px] items-center gap-2">
                <span className="font-mono text-xs leading-4 font-bold">{h} h</span>
                <span aria-hidden="true" className="relative h-2.5 rounded-full bg-muted">
                  <span className="absolute -inset-y-1 w-0.5 bg-destructive" style={{ left: `${pctOfBar(HCRIT_CM)}%` }} />
                </span>
                <span className="text-right font-mono text-xs leading-4 font-bold text-muted-foreground">—</span>
              </li>
            ))}
          </ul>
        ) : (
          <HorizonBars horizons={ponto.horizons} className="mt-1.5" />
        )}
      </div>
    </section>
  );
};
