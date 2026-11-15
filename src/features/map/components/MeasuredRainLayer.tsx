import React, { useState } from 'react';
import { MapPopup } from '@/components/ui/map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { MeasuredRainMarkers } from './MeasuredRainMarkers';
import { MeasuredRainDetail } from './MeasuredRainDetail';
import { MeasuredRainLegend } from './MeasuredRainLegend';
import type { MeasuredRain, StationAccumulation } from '../schemas/measuredRain.schema';

interface Props {
  stations: StationAccumulation[];
  data: MeasuredRain | undefined;
  isMobile: boolean;
  /** Avisa o mapa para fechar as outras seleções quando uma estação é aberta. */
  onOpen: () => void;
}

/**
 * Marcadores e detalhe da chuva medida. Vai dentro do <Map>; a seleção é estado de UI local. O detalhe abre à direita do
 * marcador (como o do ponto crítico): acima dele, era cortado no topo do mapa e coberto pelo painel esquerdo.
 */
export const MeasuredRainLayer: React.FC<Props> = ({ stations, data, isMobile, onOpen }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = stations.find((s) => s.canonicalId === selectedId);
  const close = () => setSelectedId(null);
  const detail = selected && (
    <MeasuredRainDetail station={selected} computedAtUtc={data?.computedAtUtc ?? null} stale={data?.stale ?? false} onClose={close} />
  );
  return (
    <>
      <MeasuredRainMarkers
        stations={stations}
        selectedId={selectedId}
        onSelect={(s) => {
          onOpen();
          setSelectedId(s.canonicalId);
        }}
      />
      {selected &&
        (isMobile ? (
          <BottomSheet title="Chuva medida" srTitle={selected.name ?? selected.canonicalId ?? 'Estação'} onClose={close}>
            {detail}
            <MeasuredRainLegend data={data} isLoading={false} isError={false} className="mt-3 flex flex-col gap-2 p-3" />
          </BottomSheet>
        ) : (
          <MapPopup
            longitude={selected.lon!}
            latitude={selected.lat!}
            onClose={close}
            className="p-0 border-none shadow-none bg-transparent max-w-none"
            offset={[18, 0]}
            anchor="left"
            autoPan
            label={`Chuva medida na estação ${selected.name ?? selected.canonicalId}`}
          >
            {detail}
          </MapPopup>
        ))}
    </>
  );
};
