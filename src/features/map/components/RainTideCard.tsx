import React from 'react';
import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui/panel';
import { SectionLabel } from '@/components/ui/section-label';
import { RainTideChart } from '@/components/charts/RainTideChart';
import { fmtNum } from '../utils/overview';
import type { useMapOverview } from '../hooks/useMapOverview';

type Overview = ReturnType<typeof useMapOverview>;

const stat = 'font-mono text-xl leading-6 font-bold';
const caption = 'text-[11px] leading-[14px] text-muted-foreground';

/**
 * Cartão "Chuva e maré hoje" (canto superior direito do mapa). Chuva média das estações e maré da tábua da DHN,
 * dados reais de /api/events/timeline. A maré é previsão de tábua, não medição, e não se compara com a cota do terreno (ADR 0009).
 */
export const RainTideCard: React.FC<{ overview: Overview; className?: string }> = ({ overview, className }) => {
  const { rain, tide, rainNow, tideNow, from, to, now, isError } = overview;
  const hasData = rain.some((p) => p.v != null) || tide.some((p) => p.v != null);
  const dir = tideNow?.rising == null ? null : tideNow.rising ? 'enchendo' : 'vazando';
  const summary = `Gráfico de chuva média e maré, das ${new Date(from).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' })} às ${new Date(to).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' })}; agora ${rainNow != null ? `${fmtNum(rainNow)} mm/h de chuva` : 'sem leitura de chuva'}${tideNow ? `, maré ${fmtNum(tideNow.v, 2)} m` : ''}`;
  return (
    <Panel as="section" aria-label="Chuva e maré" className={className ?? 'flex flex-col gap-2 p-3.5'}>
      <div className="flex items-baseline justify-between">
        <SectionLabel>Chuva e maré hoje</SectionLabel>
        <Link to="/eventos" className="text-xs leading-4 text-primary hover:text-foreground">Linha do tempo</Link>
      </div>
      <div className="flex gap-4">
        <div>
          <div className={stat}>{rainNow != null ? `${fmtNum(rainNow)} mm/h` : '—'}</div>
          <div className={caption}>chuva agora (média)</div>
        </div>
        <div>
          <div className={stat}>{tideNow ? `${fmtNum(tideNow.v, 2)} m` : '—'}</div>
          <div className={caption}>{dir ? `maré ${dir}` : 'maré'}</div>
        </div>
      </div>
      {hasData ? (
        <RainTideChart rain={rain} tide={tide} from={from} to={to} now={now} label={summary} />
      ) : (
        <p role="status" className="flex h-[92px] items-center justify-center rounded-lg border-2 border-dashed border-risk-unknown-edge px-3 text-center text-xs text-muted-foreground">
          {isError ? 'Chuva e maré indisponíveis agora.' : 'Sem leitura de chuva ou maré na janela.'}
        </p>
      )}
      <div className="flex gap-3 text-[11px] leading-[14px] text-muted-foreground">
        <span className="flex items-center gap-[5px]"><span aria-hidden="true" className="size-2.5 rounded-[2px] bg-chart-1" />Chuva (mm/h)</span>
        <span className="flex items-center gap-[5px]"><span aria-hidden="true" className="h-0.5 w-3 bg-sand" />Maré (m)</span>
      </div>
    </Panel>
  );
};
