import React from 'react';
import { CloudRain } from 'lucide-react';
import { MapToolPopover } from './MapToolPopover';
import { MeasuredRainLegend } from './MeasuredRainLegend';
import type { MeasuredRain } from '../schemas/measuredRain.schema';

interface Props {
  data: MeasuredRain | undefined;
  isLoading: boolean;
  isError: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "Chuva no mapa" recolhida num botão da barra do mapa; a legenda de risco ocupa o canto, como na referência. */
export const MeasuredRainLegendControl: React.FC<Props> = ({ data, isLoading, isError, open, onOpenChange }) => (
  <MapToolPopover id="rain-legend-panel" label="Legenda da chuva" icon={<CloudRain className="h-5 w-5" aria-hidden="true" />} open={open} onOpenChange={onOpenChange} panelClassName="w-80">
    <MeasuredRainLegend data={data} isLoading={isLoading} isError={isError} className="flex flex-col gap-2 border-0 bg-transparent p-3 shadow-none" />
  </MapToolPopover>
);
