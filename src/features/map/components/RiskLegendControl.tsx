import React from 'react';
import { ShieldQuestion } from 'lucide-react';
import { RiskLegendList } from '@/components/risk/RiskLegendList';
import { MapToolPopover } from './MapToolPopover';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Legenda dos níveis de risco como botão da barra do mapa, no mesmo formato de camadas e terreno. */
export const RiskLegendControl: React.FC<Props> = ({ open, onOpenChange }) => (
  <MapToolPopover
    id="risk-legend-panel"
    label="Níveis de risco"
    icon={<ShieldQuestion className="h-5 w-5" aria-hidden="true" />}
    open={open}
    onOpenChange={onOpenChange}
  >
    <RiskLegendList showExperimentalNote={false} />
  </MapToolPopover>
);
