import React from 'react';
import { Map, MapMarker, MarkerContent, MapCircle } from '@/components/ui/map';
import { useTheme } from '@/hooks/useTheme';
import { useTokenColor } from '@/lib/tokens';

interface PointLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lon: number) => void;
}

const DEFAULT_CENTER: [number, number] = [-34.877, -8.057];

/** Mapa para posicionar o ponto com um clique, com o raio de 3 km das estações sugeridas. */
export const PointLocationMap: React.FC<PointLocationMapProps> = ({ latitude, longitude, onPick }) => {
  const { theme } = useTheme();
  const primary = useTokenColor('--primary', '#5cb8ff');
  const has = latitude != null && longitude != null;
  return (
    <div className="relative h-[330px] overflow-hidden rounded-xl border border-border">
      <Map theme={theme} center={has ? [longitude, latitude] : DEFAULT_CENTER} zoom={has ? 11.3 : 11} onClick={(e) => onPick(Number(e.lngLat.lat.toFixed(5)), Number(e.lngLat.lng.toFixed(5)))}>
        {has && <MapCircle id="raio-estacoes" center={[longitude, latitude]} radiusKm={3} color={primary} opacity={0.1} strokeColor={primary} strokeWidth={1.5} strokeOpacity={1} />}
        {has && (
          <MapMarker longitude={longitude} latitude={latitude}>
            <MarkerContent><span className="block size-[18px] rounded-full border-[3px] border-card bg-primary" /></MarkerContent>
          </MapMarker>
        )}
      </Map>
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-md bg-popover px-2 py-1 font-mono text-[11px]">clique para mover · raio de 3 km</span>
    </div>
  );
};
