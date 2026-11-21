import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';
import { fmtNum } from '../utils/overview';
import { PointRegressaoBlock } from '@/features/alagamento/components/PointRegressaoBlock';

interface Props {
  point: FloodPointResponseDTO;
  status?: PreciseDataResponse | null;
  isFetchingStatus?: boolean;
  onClose: () => void;
}

const tile = 'rounded-lg bg-muted p-2';
const tileLabel = 'text-[11px] leading-[14px] text-muted-foreground';
const tileValue = 'whitespace-nowrap font-mono text-sm leading-5 font-semibold';

/** Resumo do ponto crítico selecionado (popup do mapa, 300 px; Main.dc.html). Os números vêm do status em tempo real do ponto. */
export const FloodPointPopup: React.FC<Props> = ({ point, status, isFetchingStatus = false, onClose }) => {
  const precise = status?.preciseData;
  const rain3h = precise?.historicalAggregates?.rain3h;
  const tide = precise?.tideHeightTabuaMare;
  const now = precise?.precipitation;
  const dash = isFetchingStatus ? '…' : '—';
  return (
    <section aria-label={`Resumo do ponto ${point.name}`} className="box-border flex w-[18.75rem] max-w-[calc(100vw-2rem)] flex-col gap-2.5 rounded-xl border border-border bg-popover p-3.5 text-popover-foreground shadow-elevation-overlay">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground">Ponto crítico</span>
        <button type="button" onClick={onClose} aria-label="Fechar resumo" className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div>
        <p className="m-0 text-base leading-[22px] font-bold">{point.name}</p>
        <p className="m-0 text-xs leading-4 text-muted-foreground">
          {point.municipality ?? 'Recife'}
          {point.description ? ` · ${point.description}` : ''}
        </p>
      </div>
      <PointRegressaoBlock slug={point.slug} />
      <div className="grid grid-cols-3 gap-1.5">
        <div className={tile}>
          <div className={tileLabel}>Chuva 3 h</div>
          <div className={tileValue}>{rain3h != null ? <>{fmtNum(rain3h)} <span className="text-[11px]">mm</span></> : dash}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>Maré</div>
          <div className={tileValue}>{tide != null ? <>{fmtNum(tide, 2)} <span className="text-[11px]">m</span></> : dash}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>Agora</div>
          <div className={tileValue}>{now != null ? <>{fmtNum(now)} <span className="text-[11px]">mm/h</span></> : dash}</div>
        </div>
      </div>
      <Link to={`/pontos/${point.slug}`} className="flex h-9 items-center justify-center rounded-lg bg-primary text-[13px] leading-4 font-bold text-primary-foreground hover:bg-primary/90">
        Abrir análise completa
      </Link>
    </section>
  );
};
