import React from 'react';
import { ShieldQuestion } from 'lucide-react';
import { RiskLegendList } from '@/components/risk/RiskLegendList';
import { MapToolPopover } from './MapToolPopover';

interface Props {
  /** Sem `open`/`onOpenChange` o botão controla o próprio estado (celular). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  bottomReserve?: number;
}

/** Legenda dos níveis de risco como botão da barra do mapa, no mesmo formato de camadas e terreno. */
export const RiskLegendControl: React.FC<Props> = ({ open, onOpenChange, className, bottomReserve }) => (
  <MapToolPopover
    id="risk-legend-panel"
    label="Níveis de risco"
    icon={<ShieldQuestion className="h-5 w-5" aria-hidden="true" />}
    open={open}
    onOpenChange={onOpenChange}
    className={className}
    bottomReserve={bottomReserve}
  >
    <RiskLegendList showExperimentalNote={false} />
  </MapToolPopover>
);
