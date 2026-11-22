import React from 'react';
import { Panel, PanelTitle } from '@/features/operacao/components/Panel';
import { useTerrainAttributes } from '@/features/map/hooks/useTerrainAttributes';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { RainCandidates } from '../schemas/rain-candidates.schema';
import { waterWeatherTiles, type TerrainInput } from '../utils/waterWeather';

export const WaterWeatherPanel: React.FC<{ point: FloodPointResponseDTO | undefined; rain?: RainCandidates }> = ({ point, rain }) => {
  const state = useTerrainAttributes(point?.slug ?? '');
  const terrain: TerrainInput = state.status !== 'ready' ? { status: state.status } : { status: state.data.status === 'NO_DATA' ? 'no_data' : 'ready', streetElevationM: state.data.streetElevationM };
  return (
    <Panel aria-label="Água e tempo agora" data-testid="terrain-facts">
      <PanelTitle>Água e tempo agora</PanelTitle>
      <dl className="m-0 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {waterWeatherTiles(point, rain, terrain).map((t) => (
          <div key={t.label} className="flex flex-col gap-0.5 rounded-xl bg-muted p-2.5" data-testid="water-tile">
            <dt className="text-[11px] leading-[14px] text-muted-foreground">{t.label}</dt>
            <dd className={`m-0 font-mono text-[17px] font-bold leading-[22px] ${t.tone ?? 'text-foreground'}`}>{t.value}</dd>
            <dd className="m-0 text-[11px] leading-[14px] text-muted-foreground">{t.sub}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
};
