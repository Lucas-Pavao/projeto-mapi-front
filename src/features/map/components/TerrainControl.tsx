import React from 'react';
import { Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TerrainLegend } from './TerrainLegend';
import { MapToolPopover } from './MapToolPopover';
import type { TerrainStatus } from '../utils/terrain';

interface TerrainControlProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  status?: TerrainStatus;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Camada de terreno como botão da barra do mapa. O painel tem o interruptor, o estado de carga, a legenda de cotas
 * (só com a camada ligada) e o que a camada cobre. Se a camada falhar com o painel fechado, ele abre para mostrar o erro.
 */
export const TerrainControl: React.FC<TerrainControlProps> = ({ enabled, onChange, status = 'off', open, onOpenChange, className }) => {
  const forceOpen = enabled && status === 'error';
  return (
    <div data-terrain-status={status}>
      <MapToolPopover
        id="terrain-control-body"
        label="Terreno (hipsometria)"
        stateLabel={enabled ? 'ligado' : 'desligado'}
        icon={<Mountain className="h-5 w-5" aria-hidden="true" />}
        open={forceOpen ? true : open}
        onOpenChange={onOpenChange}
        active={enabled}
        badge={enabled}
        panelClassName={className}
      >
        <div className="space-y-2 px-3 py-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Terreno (hipsometria)"
            onClick={() => onChange(!enabled)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
          >
            Mostrar no mapa
            <span
              aria-hidden="true"
              className={cn('relative h-4 w-7 shrink-0 rounded-full border border-white/30 transition-colors', enabled ? 'bg-emerald-600' : 'bg-zinc-700')}
            >
              <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', enabled ? 'left-3.5' : 'left-0.5')} />
            </span>
          </button>

          <div aria-live="polite">
            {enabled && status === 'loading' && <p className="text-2xs text-zinc-300">Carregando terreno…</p>}
            {enabled && status === 'error' && (
              <p role="alert" className="text-2xs text-red-300">
                Não foi possível carregar o terreno. O restante do mapa segue funcionando.
              </p>
            )}
          </div>
        </div>

        {enabled && status !== 'error' && <TerrainLegend />}

        <p className="border-t border-white/10 px-3 py-2 text-2xs leading-snug text-zinc-400">
          Cobre a área das folhas do MDT baixadas (Recife). Visível a partir do zoom 10; fora dessa área o mapa fica sem cor.
        </p>
      </MapToolPopover>
    </div>
  );
};
