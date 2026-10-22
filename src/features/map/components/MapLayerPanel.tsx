import React from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapToolPopover } from './MapToolPopover';
import { LAYER_OPTIONS } from '../utils/layers';

interface Props {
  activeLayers: readonly string[];
  onToggle: (layerId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Painel "Camadas do mapa": liga e desliga grupos de sensores e os pontos críticos. */
export const MapLayerPanel: React.FC<Props> = ({ activeLayers, onToggle, open, onOpenChange }) => (
  <MapToolPopover id="layer-panel" label="Camadas do mapa" icon={<Layers className="h-5 w-5" aria-hidden="true" />} panelClassName="w-56 p-1.5" open={open} onOpenChange={onOpenChange}>
    <div role="group" aria-label="Camadas" className="flex flex-col gap-1 pt-1">
      {LAYER_OPTIONS.map((layer) => {
        const active = activeLayers.includes(layer.id);
        return (
          <button
            key={layer.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(layer.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-2xs font-bold transition-all group',
              active ? 'bg-secondary text-foreground shadow-inner' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <layer.icon className={cn('h-3.5 w-3.5', active ? layer.color : 'opacity-30')} />
            <span className="truncate">{layer.id}</span>
            {active && <div className="ml-auto h-1 w-1 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  </MapToolPopover>
);
