import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import { InfoTip } from '@/components/InfoTip';
import { num } from '@/features/operacao/utils/format';
import { distanceText, missingAccText } from '@/features/points/utils/rainCandidates';
import type { RainCandidates } from '@/features/points/schemas/rain-candidates.schema';
import type { MeasuredRain } from '@/features/points/schemas/measured-rain.schema';
import type { FloodPointResponseDTO } from '../../types';
import { cn } from '@/lib/utils';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { RegressaoCard } from '@/features/alagamento/components/RegressaoCard';
import { titleCasePlace } from '../../utils/overview';

interface Props {
  point: FloodPointResponseDTO;
  rain?: RainCandidates;
  /** Chuva medida acumulada (onda 16, Fase 7.3): substitui a estimada do Open-Meteo no card. */
  measured?: MeasuredRain;
  onClose?: () => void;
  onOpenAnalysis?: () => void;
  /** Só ADMIN vê o alerta por regressão (modo sombra, até a validação ser aprovada). */
  isAdmin?: boolean;
  alagamento?: AlagamentoPonto | null;
  alagamentoLoading?: boolean;
  alagamentoError?: boolean;
  /** Bloco "Hoje" (INMET, dia de risco, próxima hora), montado pelo contêiner. */
  hoje?: React.ReactNode;
}

const SHELL = 'mapi-enter-modal flex w-[20rem] max-w-full min-h-0 shrink overflow-y-auto overscroll-contain flex-col gap-2.5 rounded-[14px] border border-t-4 border-border bg-popover p-3.5 text-foreground shadow-[var(--elevation-overlay),var(--surface-highlight)]';

export const VISITOR_INFO = 'O alerta de alagamento por regressão é experimental: enquanto a validação não for aprovada, só o administrador vê. Aqui ficam a chuva medida e a maré.';

/**
 * Card-resumo do ponto crítico (seção 5.2, prancha "Nível 6"). Sem abas: o nível é o do alerta por regressão.
 * Nunca "risco baixo" nem "seguro"; leitura em falha ou sem cálculo nunca vira "Sem alerta".
 */
export const PointCard: React.FC<Props> = ({ point, rain, measured, onClose, onOpenAnalysis, isAdmin = false, alagamento, alagamentoLoading = false, alagamentoError = false, hoje }) => {
  const place = `${titleCasePlace(point.municipality ?? 'Recife')}${point.description ? ` · ${point.description}` : ''}`;
  if (isAdmin && alagamento && !alagamentoLoading) {
    return (
      <RegressaoCard ponto={alagamento} name={point.name} place={place} onClose={onClose} onAnalysis={onOpenAnalysis} pageTo={`/pontos/${point.slug}`} extra={hoje}
        className="w-[20rem] max-w-full overflow-y-auto bg-popover p-3.5 shadow-elevation-overlay" />
    );
  }

  const header = (chip: React.ReactNode) => (
    <>
      <div className="flex items-center justify-between gap-2">
        {chip}
        {onClose && <button type="button" onClick={onClose} aria-label="Fechar resumo do ponto" className="mapi-press flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" aria-hidden="true" /></button>}
      </div>
      <div>
        <p className="m-0 text-base font-extrabold leading-[22px]">{point.name}</p>
        <p className="m-0 text-xs leading-4 text-muted-foreground">{place}</p>
      </div>
    </>
  );
  const actions = (
    <div className="flex gap-2">
      <button type="button" onClick={onOpenAnalysis} className="mapi-press h-10 flex-1 rounded-[10px] border-0 bg-primary text-[13px] font-bold text-primary-foreground shadow-elevation-raised hover:bg-primary/90">Análise completa</button>
      <Link to={`/pontos/${point.slug}`} aria-label="Abrir a página do ponto" className="mapi-press flex size-10 items-center justify-center rounded-[10px] border border-border text-foreground hover:bg-muted"><ExternalLink className="size-4" aria-hidden="true" /></Link>
    </div>
  );

  if (isAdmin) {
    const text = alagamentoLoading ? 'Lendo o alerta de alagamento…'
      : alagamentoError ? 'Não foi possível ler o alerta de alagamento agora.'
        : 'Alerta de alagamento ainda não calculado para este ponto.';
    const info = alagamentoLoading ? 'Buscando o último ciclo do alerta.' : 'Sem leitura não é sem alerta: o nível deste ponto é desconhecido até o próximo ciclo.';
    return (
      <section role="dialog" aria-label={`Resumo do ponto ${point.name}`} data-state={alagamentoLoading ? 'loading' : alagamentoError ? 'error' : 'absent'}
        className={cn(SHELL, 'border-t-muted-foreground [border-top-style:dashed]')}>
        {header(
          <span data-testid="flood-chip" data-level="SEM_DADO" className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/50 bg-muted px-2.5 text-sm font-bold text-muted-foreground">
            {alagamentoLoading ? 'Lendo…' : 'Alerta sem leitura'}<InfoTip text={info} side="bottom" />
          </span>,
        )}
        <p data-testid="alagamento-estado" className="m-0 text-sm text-muted-foreground">{text}</p>
        {hoje}
        {actions}
      </section>
    );
  }

  const used = rain?.candidates.find((c) => c.stationId === rain.usedStationId);
  const agg = point.liveData?.historicalAggregates;
  const tide = point.tideHeight ?? point.liveData?.tideHeight ?? null;
  const tiles: Array<{ l: string; v: string; s: string; warn: boolean }> = [
    { l: 'Chuva agora', v: rain?.valueMm != null && used ? `${num(rain.valueMm, 1)} mm/h` : 'sem dado', s: used && rain?.valueMm != null ? `${used.name} · ${distanceText(used.distanceM)}` : 'nenhuma estação', warn: rain?.valueMm == null },
    measured
      ? { l: 'Chuva 3 h', v: measured.rain3hMm != null ? `${num(measured.rain3hMm, 1)} mm` : 'lacuna',
        s: `medida · 6 h ${measured.rain6hMm != null ? `${num(measured.rain6hMm, 1)}` : '—'} · 24 h ${measured.rain24hMm != null ? `${num(measured.rain24hMm, 1)} mm` : '—'}`,
        warn: measured.rain3hMm == null }
      : { l: 'Chuva 3 h', v: agg?.rain3h != null ? `${num(agg.rain3h, 1)} mm` : missingAccText(used != null), s: agg?.rainSource ? 'estimada · Open-Meteo' : 'sem leitura', warn: agg?.rain3h == null },
    { l: 'Maré', v: tide != null ? `${num(tide, 2)} m` : '—', s: point.tideSource === 'HARMONIC' ? 'maré · reserva harmônica' : point.tideUnit ?? 'DHN (NR)', warn: false },
  ];
  return (
    <section role="dialog" aria-label={`Resumo do ponto ${point.name}`} data-state="visitor" className={cn(SHELL, 'border-t-warning')}>
      {header(
        <span data-testid="flood-chip" data-level="VISITOR" className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-warning/60 bg-warning/10 px-2.5 text-sm font-bold text-warning">
          Alerta experimental<InfoTip text={VISITOR_INFO} side="bottom" />
        </span>,
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {tiles.map((t) => (
          <div key={t.l} data-testid="tile" className="rounded-lg bg-secondary px-2 py-[7px]">
            <div className="text-[10px] leading-[13px] text-muted-foreground">{t.l}</div>
            <div className={cn('font-mono text-[13px] font-bold leading-[18px]', t.warn && 'text-warning')}>{t.v}</div>
            <div className="truncate text-[10px] leading-[13px] text-muted-foreground">{t.s}</div>
          </div>
        ))}
      </div>
      {hoje}
      {actions}
    </section>
  );
};
