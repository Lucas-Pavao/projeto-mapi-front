import React from 'react';
import { ShieldQuestion } from 'lucide-react';
import { InfoTip } from '@/components/InfoTip';
import { LEGEND_RULE } from '@/features/alagamento/utils/alagamentoText';
import { AlertLegendList } from './MapAlertLegend';
import { MapToolPopover } from './MapToolPopover';

interface Props {
  /** Sem `open`/`onOpenChange` o botão controla o próprio estado (celular). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  bottomReserve?: number;
}

/** Legenda do alerta como botão da barra do mapa no celular (5.11 item 6); a regra fica no ⓘ. */
export const RiskLegendControl: React.FC<Props> = ({ open, onOpenChange, className, bottomReserve }) => (
  <MapToolPopover
    id="risk-legend-panel"
    label="Legenda"
    icon={<ShieldQuestion className="h-5 w-5" aria-hidden="true" />}
    open={open}
    onOpenChange={onOpenChange}
    className={className}
    bottomReserve={bottomReserve}
  >
    <div className="mb-2 flex items-center justify-between text-xs font-bold">Alerta de alagamento<InfoTip text={LEGEND_RULE} align="end" /></div>
    <AlertLegendList />
  </MapToolPopover>
);
