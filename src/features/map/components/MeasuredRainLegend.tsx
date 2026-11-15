import React from 'react';
import { Panel } from '@/components/ui/panel';
import { SectionLabel } from '@/components/ui/section-label';
import { CEMADEN_ATTRIBUTION, recifeWithReference } from '../utils/measuredRain';
import type { MeasuredRain } from '../schemas/measuredRain.schema';

interface Props {
  data: MeasuredRain | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}

const chip = 'inline-flex h-[18px] min-w-[56px] shrink-0 items-center whitespace-nowrap justify-center rounded-[4px] border-[1.5px] bg-popover px-1 font-mono text-[10px] font-semibold';

/**
 * Legenda da chuva no mapa. Diz por escrito, não só por cor, o que é medido e o que é reanálise: o pico medido pelo
 * pluviômetro chega a ~3× o da reanálise (62 contra 21 mm/h, docs/EVENTOS-DE-CHUVA.md do projeto-mapi-api).
 */
export const MeasuredRainLegend: React.FC<Props> = ({ data, isLoading, isError, className }) => {
  const computed = recifeWithReference(data?.computedAtUtc);
  return (
    <Panel as="section" aria-label="Legenda da chuva" className={className ?? 'flex flex-col gap-2 p-3'}>
      <SectionLabel>Chuva no mapa</SectionLabel>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[11px] leading-[14px]">
        <li className="flex items-center gap-2">
          <span className={`${chip} border-chart-1 text-foreground`}>12,4 mm</span>
          <span><b>Medida</b> nas últimas 3 h, pluviômetro do Cemaden</span>
        </li>
        <li className="flex items-center gap-2">
          <span className={`${chip} border-border text-muted-foreground`}>0,0 mm</span>
          <span>Medida: a estação mediu e não choveu</span>
        </li>
        <li className="flex items-center gap-2">
          <span className={`${chip} border-dashed border-risk-unknown-edge text-muted-foreground`}>sem dado</span>
          <span>A estação não mediu (não é zero)</span>
        </li>
        <li className="flex items-center gap-2">
          <span className={`${chip} border-warning text-warning`}>modelo</span>
          <span><b>Reanálise</b> (Open-Meteo): estimada, não medida; suaviza o pico. Só no cartão de análise de local</span>
        </li>
      </ul>
      <p role="status" className="m-0 text-[11px] leading-[14px] text-muted-foreground">
        {isError
          ? 'Chuva medida indisponível agora.'
          : isLoading
            ? 'Carregando chuva medida…'
            : computed
              ? `Calculada às ${computed}${data?.stale ? ' — desatualizada' : ''}.`
              : 'Sem horário de cálculo.'}
      </p>
      <p className="m-0 text-[10px] font-bold tracking-wide text-muted-foreground">{CEMADEN_ATTRIBUTION}</p>
    </Panel>
  );
};
