import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { cn } from '@/lib/utils';
import { measuredKind, measuredText } from '../utils/measuredRain';
import type { StationAccumulation } from '../schemas/measuredRain.schema';

interface Props {
  stations: StationAccumulation[];
  selectedId: string | null;
  onSelect: (station: StationAccumulation) => void;
}

/**
 * Estações canônicas com a chuva MEDIDA nas últimas 3 h (pluviômetro do Cemaden). Forma própria, quadrada, para não se
 * confundir com o rótulo redondo dos sensores. Três estados visuais:
 * - com chuva: borda e gota cheias, valor em mm;
 * - zero: borda contínua neutra, "0,0 mm";
 * - sem dado: borda tracejada, sem gota, "sem dado" (a estação não mediu; não é zero).
 */
export const MeasuredRainMarkers: React.FC<Props> = ({ stations, selectedId, onSelect }) => (
  <>
    {stations.map((s) => {
      const kind = measuredKind(s.acc3hMm);
      const text = measuredText(s.acc3hMm);
      const selected = s.canonicalId === selectedId;
      return (
        <MapMarker
          key={s.canonicalId!}
          longitude={s.lon!}
          latitude={s.lat!}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(s);
          }}
          label={`Chuva medida em 3 h, estação ${s.name ?? s.canonicalId}: ${kind === 'no-data' ? 'sem dado' : text}. Pressione enter para abrir.`}
        >
          <MarkerContent>
            <div className="cursor-pointer py-[11px] lg:py-0">
              <div
                data-kind={kind}
                className={cn(
                  'flex h-[22px] items-center gap-[5px] whitespace-nowrap rounded-[4px] border-[1.5px] bg-popover pl-[5px] pr-2 font-mono text-[11px] leading-[14px] font-semibold shadow-elevation-raised',
                  kind === 'value' && 'border-chart-1 text-foreground',
                  kind === 'zero' && 'border-border text-muted-foreground',
                  kind === 'no-data' && 'border-dashed border-risk-unknown-edge text-muted-foreground',
                  selected && 'ring-2 ring-ring',
                )}
              >
                <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true" className={kind === 'value' ? 'fill-chart-1' : 'fill-none stroke-current'}>
                  {kind === 'no-data' ? <path d="M2 6h6" strokeWidth="1.6" /> : <path d="M5 1C3.5 3.4 1.5 5.5 1.5 7.6a3.5 3.5 0 0 0 7 0C8.5 5.5 6.5 3.4 5 1Z" strokeWidth="1.2" />}
                </svg>
                {text}
              </div>
            </div>
          </MarkerContent>
        </MapMarker>
      );
    })}
  </>
);
