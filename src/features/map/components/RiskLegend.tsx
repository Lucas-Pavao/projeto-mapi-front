import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { RiskLegendList } from './RiskLegendList';
import { MapToolPopover } from './MapToolPopover';

interface RiskLegendProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/** Legenda de risco (4 estados) como botão da barra do mapa; o painel abre sob demanda. */
export const RiskLegend: React.FC<RiskLegendProps> = ({ open, onOpenChange, className }) => (
  <MapToolPopover
    id="risk-legend-body"
    label="Legenda de risco"
    icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />}
    open={open}
    onOpenChange={onOpenChange}
    panelClassName={className}
  >
    <RiskLegendList />
  </MapToolPopover>
);
