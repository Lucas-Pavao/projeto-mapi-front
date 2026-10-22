import React from 'react';
import { MapMarker, MarkerContent } from '@/components/ui/map';
import { fmtNum } from '../utils/overview';

/** Alguns metros ao largo de Boa Viagem: só ancora o rótulo no mar; a maré vale para todo o litoral (tábua de Recife). */
const OFFSHORE: [number, number] = [-34.866, -8.092];

/** Rótulo "Maré 0,22 m" no mar, com seta de enchente ou vazante (Main.dc.html). Tábua da DHN: previsão, não medição. */
export const TideMarker: React.FC<{ tide: { v: number; rising: boolean | null } }> = ({ tide }) => (
  <MapMarker longitude={OFFSHORE[0]} latitude={OFFSHORE[1]} label={`Maré ${fmtNum(tide.v, 2)} m${tide.rising == null ? '' : tide.rising ? ', enchendo' : ', vazando'}, tábua da DHN`}>
    <MarkerContent>
      <div className="flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-sand bg-popover pl-1.5 pr-2.5 font-mono text-xs leading-4 font-bold text-foreground shadow-elevation-overlay">
        {tide.rising != null && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d={tide.rising ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'} />
          </svg>
        )}
        Maré {fmtNum(tide.v, 2)} m
      </div>
    </MarkerContent>
  </MapMarker>
);
