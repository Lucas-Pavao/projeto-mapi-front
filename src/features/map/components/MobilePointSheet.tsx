import React, { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { useRainCandidates } from '@/features/points/hooks/useRainCandidates';
import { distanceText, missingAccText } from '@/features/points/utils/rainCandidates';
import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';
import { fmtNum } from '../utils/overview';
import { formatRecife } from '../utils/datetime';
import { PointRegressaoBlock } from '@/features/alagamento/components/PointRegressaoBlock';

interface Props {
  point: FloodPointResponseDTO;
  status: PreciseDataResponse | null;
  isFetchingStatus: boolean;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
  onReport: () => void;
  /** Abre a análise completa (3 abas) numa folha inferior. */
  onOpenAnalysis?: () => void;
}

const nav = 'flex size-11 items-center justify-center rounded-[10px] border border-border bg-transparent text-foreground';
const tile = 'rounded-xl bg-muted p-3';
const tileLabel = 'text-[11px] text-muted-foreground';
const tileValue = 'font-mono text-lg leading-6 font-extrabold';

/** Detalhe do ponto no celular (componente MobilePonto da prancha Nível 6): o bloco do alerta por regressão em largura cheia, os números medidos, anterior/próximo e "Reportar cenário no local". */
export const MobilePointSheet: React.FC<Props> = ({ point, status, isFetchingStatus, index, total, onPrev, onNext, onBack, onReport, onOpenAnalysis }) => {
  const titleId = useId();
  const precise = status?.preciseData;
  const dash = isFetchingStatus ? '…' : '—';
  const rain3h = precise?.historicalAggregates?.rain3h;
  const tide = precise?.tideHeightTabuaMare;
  const now = precise?.precipitation;
  const rain = useRainCandidates(point.slug).data;
  const usedRain = rain?.candidates.find((c) => c.stationId === rain.usedStationId);
  const clock = formatRecife(new Date().toISOString())?.slice(-5).replace(':', 'h');
  return (
    <ModalDialog label="Detalhe do ponto" labelledBy={titleId} onClose={onBack} className="pointer-events-none fixed inset-0 z-[60]">
      <button type="button" onClick={onBack} aria-label="Voltar ao mapa" className="pointer-events-auto absolute left-3 top-3 flex size-12 items-center justify-center rounded-[14px] border border-border bg-popover text-foreground shadow-elevation-overlay">
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <span className="pointer-events-auto absolute right-3 top-3 mt-2 flex h-8 items-center gap-1.5 rounded-full border border-border bg-popover px-3 font-mono text-xs font-bold">
        <span aria-hidden="true" className="live-dot size-2 rounded-full bg-success" />
        {clock}
      </span>
      <section className="scroll pointer-events-auto absolute inset-x-0 bottom-0 box-border flex h-[min(640px,calc(100dvh-204px))] flex-col gap-3.5 rounded-t-[18px] border-t border-border bg-card px-[18px] pb-5 pt-2 shadow-elevation-overlay">
        <span aria-hidden="true" className="h-[5px] w-11 shrink-0 self-center rounded-full bg-input" />
        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrev} aria-label="Ponto anterior" className={nav}><ChevronLeft className="size-[18px]" aria-hidden="true" /></button>
          <div className="flex-1 text-center text-xs text-muted-foreground">ponto {index + 1} de {total}</div>
          <button type="button" onClick={onNext} aria-label="Próximo ponto" className={nav}><ChevronRight className="size-[18px]" aria-hidden="true" /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 id={titleId} className="m-0 text-2xl leading-[30px] font-extrabold">{point.name}</h1>
          <p className="m-0 text-[13px] text-muted-foreground">{point.municipality ?? 'Recife'}</p>
        </div>
        <PointRegressaoBlock slug={point.slug} />
        <div className="grid grid-cols-2 gap-2">
          <div className={tile}><div className={tileLabel}>Chuva 3 h</div><div className={tileValue}>{rain3h != null ? `${fmtNum(rain3h)} mm` : isFetchingStatus ? '…' : <span className="text-warning">{missingAccText(usedRain != null)}</span>}</div></div>
          <div className={tile}>
            <div className={tileLabel}>Chuva agora</div>
            <div className={tileValue}>{rain ? (rain.valueMm != null && usedRain ? `${fmtNum(rain.valueMm)} mm/h` : '—') : now != null ? `${fmtNum(now)} mm/h` : dash}</div>
            {rain && <div className="text-[11px] text-muted-foreground">{usedRain && rain.valueMm != null ? `${usedRain.name} · ${distanceText(usedRain.distanceM)}` : 'nenhuma estação com valor'}</div>}
          </div>
          <div className={tile}><div className={tileLabel}>Maré</div><div className={tileValue}>{tide != null ? `${fmtNum(tide, 2)} m` : dash}</div></div>
          <div className={tile}><div className={tileLabel}>Mecanismo</div><div className="text-[13px] leading-[17px] font-bold">{point.description ?? '—'}</div></div>
        </div>
        {onOpenAnalysis && (
          <button type="button" onClick={onOpenAnalysis} className="flex h-11 flex-none items-center justify-center rounded-[10px] border border-border bg-transparent text-sm font-bold text-foreground">
            Análise completa
          </button>
        )}
        <button type="button" onClick={onReport} className="flex h-[52px] flex-none items-center justify-center rounded-[10px] bg-primary text-[15px] font-extrabold text-primary-foreground">
          Reportar cenário no local
        </button>
      </section>
    </ModalDialog>
  );
};
