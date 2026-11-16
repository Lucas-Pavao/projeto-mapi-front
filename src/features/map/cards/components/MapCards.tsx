import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapMarker, MapRoute, MarkerContent, useMap } from '@/components/ui/map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { FloodPointResponseDTO, SensorResponseDTO } from '../../types';
import type { StationAnchor } from '../utils/stationResolve';
import { useLocationAnalysis } from '../hooks/useLocationAnalysis';
import type { useMapCards } from '../hooks/useMapCards';
import { circleCoordinates, lineStyleOf, themeLinePalette } from '../utils/locationView';
import { mergeStatus } from '../utils/mergeStatus';
import { AnalysisPanelContainer, LocationCardContainer, PointCardContainer, RiverCardContainer, StationCardContainer } from './CardContainers';
import { CardFrame } from './CardFrame';

type Cards = ReturnType<typeof useMapCards>;

interface CommonProps {
  cards: Cards;
  floodPoints: FloodPointResponseDTO[];
  /** Status em tempo real do ponto selecionado (previsão e leituras mais novas). */
  floodPointStatus: Parameters<typeof mergeStatus>[1];
  isMobile: boolean;
  /** Sincroniza o destaque do marcador do ponto no mapa ao fechar/trocar. */
  onSelectPoint: (p: FloodPointResponseDTO) => void;
  onCloseSelection: () => void;
}

/**
 * Card ancorado a uma coordenada, como no protótipo: ao lado do marcador (à direita; perto da borda direita, à
 * esquerda), com o topo perto do marcador e preso entre 16 px e {@link CARD_TOP_MAX} px do alto do mapa. O mapa não se
 * move ao abrir; o card acompanha o arrasto e rola por dentro quando é mais alto que o espaço.
 */
const CARD_W = 320;
const CARD_GAP = 24;
const CARD_TOP_MAX = 190;

export function anchoredBox(x: number, y: number, mapW: number, mapH: number, width = CARD_W): { left: number; top: number; maxHeight: number } {
  const right = x + CARD_GAP + width + 16 <= mapW;
  const left = right ? x + CARD_GAP : Math.max(16, x - CARD_GAP - width);
  const top = Math.max(16, Math.min(CARD_TOP_MAX, y - 120));
  return { left, top, maxHeight: Math.max(240, mapH - top - 16) };
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

const AnchoredCard: React.FC<{ lon: number; lat: number; label: string; children: React.ReactNode }> = ({ lon, lat, label, children }) => {
  const { map } = useMap();
  const [box, setBox] = React.useState<{ left: number; top: number; maxHeight: number } | null>(null);
  React.useEffect(() => {
    if (!map) return;
    const update = () => {
      const p = map.project([lon, lat]);
      const c = map.getContainer();
      setBox(anchoredBox(p.x, p.y, c.clientWidth, c.clientHeight));
    };
    update();
    map.on('move', update);
    map.on('resize', update);
    return () => { map.off('move', update); map.off('resize', update); };
  }, [map, lon, lat]);
  if (!map || !box) return null;
  return createPortal(
    <div data-testid="anchored-card" aria-label={label} className="absolute z-30 overflow-y-auto overscroll-contain rounded-[14px]"
      style={{ left: box.left, top: box.top, maxHeight: box.maxHeight }}
      // Rolar ou arrastar dentro do card não mexe no mapa.
      onWheel={stop} onMouseDown={stop} onTouchStart={stop} onDoubleClick={stop} onClick={stop}>
      {children}
    </div>,
    map.getContainer(),
  );
};

interface LayerProps extends CommonProps {
  stations: StationAnchor[];
  riverSensor: SensorResponseDTO | undefined;
}

/** Dentro do <Map>: popups do ponto, da estação e do rio, e o alfinete, o círculo de 5 km e as linhas do local. */
export const MapCardsLayer: React.FC<LayerProps> = ({ cards, floodPoints, floodPointStatus, isMobile, stations, riverSensor }) => {
  const { state } = cards;
  const point = state.point ? floodPoints.find((p) => p.slug === state.point) : undefined;
  const merged = point ? mergeStatus(point, floodPointStatus) : undefined;
  const station = state.station && !state.analysis && !state.location ? stations.find((s) => s.canonicalId === state.station) : undefined;
  const closePoint = useCallback(() => cards.close('closePoint'), [cards]);
  const closeStation = useCallback(() => cards.close('closeStation'), [cards]);
  const closeRiver = useCallback(() => cards.close('closeRiver'), [cards]);
  return (
    <>
      {merged && !isMobile && (
        <AnchoredCard lon={merged.longitude} lat={merged.latitude} label={`Resumo do ponto ${merged.name}`}>
          <CardFrame onClose={closePoint}><PointCardContainer point={merged} onClose={closePoint} onOpenAnalysis={() => cards.openAnalysis(merged.slug)} /></CardFrame>
        </AnchoredCard>
      )}
      {station && station.lat != null && station.lon != null && !isMobile && (
        <AnchoredCard lon={station.lon} lat={station.lat} label={`Pluviômetro ${station.name ?? station.canonicalId}`}>
          <CardFrame onClose={closeStation}><StationCardContainer id={station.canonicalId as string} onClose={closeStation} onOpenPoint={cards.openPoint} /></CardFrame>
        </AnchoredCard>
      )}
      {riverSensor && state.river && riverSensor.latitude != null && riverSensor.longitude != null && !isMobile && (
        <AnchoredCard lon={riverSensor.longitude} lat={riverSensor.latitude} label={`Régua do rio ${riverSensor.riverName ?? riverSensor.stationName ?? ''}`}>
          <CardFrame onClose={closeRiver}><RiverCardContainer sensor={riverSensor} onClose={closeRiver} /></CardFrame>
        </AnchoredCard>
      )}
      {state.location && <LocationOverlay lat={state.location.lat} lon={state.location.lon} />}
    </>
  );
};

/** Alfinete, círculo tracejado de 5 km e linhas até as candidatas: cheia = usada, tracejada = menor/sem valor, vermelha = reprovada. */
const LocationOverlay: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const q = useLocationAnalysis({ lat, lon });
  const ring = circleCoordinates(lat, lon, 5000);
  const palette = themeLinePalette();
  // Rótulo "5 km" na borda leste do círculo, como no protótipo.
  const east = ring[0];
  return (
    <>
      <MapRoute id="location-radius" coordinates={ring} color={palette.primary} width={1.5} opacity={0.6} dashArray={[3, 2.5]} interactive={false} />
      {q.data?.rain.candidates.filter((c) => c.lat != null && c.lon != null).map((c) => {
        const st = lineStyleOf(c, palette);
        return <MapRoute key={c.stationId} id={`location-line-${c.stationId}`} coordinates={[[lon, lat], [c.lon as number, c.lat as number]]} color={st.color} width={st.width} dashArray={st.dash} opacity={0.9} interactive={false} />;
      })}
      <MapMarker longitude={east[0]} latitude={east[1]} offset={[-20, -10]}>
        <MarkerContent><span aria-hidden="true" className="pointer-events-none font-mono text-[11px] font-bold text-primary">5 km</span></MarkerContent>
      </MapMarker>
      <MapMarker longitude={lon} latitude={lat}>
        <MarkerContent>
          <div data-testid="location-pin" aria-label="Local analisado" className="flex size-[26px] items-center justify-center rounded-full border-[3px] border-primary bg-popover shadow-elevation-overlay">
            <span aria-hidden="true" className="size-[9px] rounded-full bg-primary" />
          </div>
        </MarkerContent>
      </MapMarker>
    </>
  );
};

/** Card da estação encaixado: ao lado do painel de análise (480 px) ou da análise de local (400 px), sem cobrir nenhum. */
function stationDockSide(s: Cards['state']): string {
  if (s.analysis) return 'right-[496px]';
  if (s.location) return s.location.side === 'left' ? 'left-[808px]' : 'right-[432px]';
  return 'right-4';
}

interface DockProps extends CommonProps {
  stations: StationAnchor[];
  riverSensor: SensorResponseDTO | undefined;
  onReportAt: (c: { lat: number; lng: number }) => void;
}

/** Fora do <Map>: painel de análise (480 px), card da estação ao lado dele, card de local e as folhas do celular. */
export const MapCardsDock: React.FC<DockProps> = ({ cards, floodPoints, floodPointStatus, isMobile, onSelectPoint, onReportAt, stations, riverSensor }) => {
  const { state } = cards;
  const analysisPoint = state.analysis ? floodPoints.find((p) => p.slug === state.analysis?.slug) : undefined;
  const merged = analysisPoint ? mergeStatus(analysisPoint, floodPointStatus) : undefined;
  // No celular, fechar a análise volta ao resumo do ponto (MobilePointSheet); no desktop só fecha o painel.
  const closeAnalysis = () => {
    const slug = state.analysis?.slug;
    cards.close('closeAnalysis');
    if (isMobile && slug) cards.openPoint(slug);
  };
  const closeStation = () => cards.close('closeStation');
  const closeLocation = () => cards.close('closeLocation');
  const openPoint = (slug: string) => { const p = floodPoints.find((x) => x.slug === slug); if (p) onSelectPoint(p); else cards.openPoint(slug); };
  const analysis = merged && state.analysis && (
    <AnalysisPanelContainer point={merged} tab={state.analysis.tab} onTab={cards.setTab} onClose={closeAnalysis} onOpenStation={cards.openStation} />
  );
  const stationOnMap = Boolean(state.station && stations.some((x) => x.canonicalId === state.station && x.lat != null && x.lon != null));
  const stationDock = state.station && (state.analysis || state.location || !stationOnMap) && <StationCardContainer id={state.station} onClose={closeStation} onOpenPoint={openPoint} />;
  const location = state.location && (
    <LocationCardContainer lat={state.location.lat} lon={state.location.lon} onClose={closeLocation} onOpenPoint={openPoint} onOpenStation={cards.openStationFromLocation} onReport={() => onReportAt({ lat: state.location!.lat, lng: state.location!.lon })} />
  );
  if (isMobile) {
    return (
      <>
        {analysis && <BottomSheet title="Análise completa" srTitle={merged?.name} onClose={closeAnalysis}><div className="h-[min(70vh,640px)]">{analysis}</div></BottomSheet>}
        {location && <BottomSheet title="Análise de local" onClose={closeLocation}>{location}</BottomSheet>}
        {state.station && <BottomSheet title="Pluviômetro" onClose={closeStation}><StationCardContainer id={state.station} onClose={closeStation} onOpenPoint={openPoint} /></BottomSheet>}
        {state.river && riverSensor && <BottomSheet title="Régua do rio" srTitle={riverSensor.stationName ?? undefined} onClose={() => cards.close('closeRiver')}><RiverCardContainer sensor={riverSensor} onClose={() => cards.close('closeRiver')} /></BottomSheet>}
      </>
    );
  }
  return (
    <>
      {analysis && <CardFrame onClose={closeAnalysis} outside={false} className="absolute inset-y-0 right-0 z-40 w-[480px] max-w-full">{analysis}</CardFrame>}
      {stationDock && <CardFrame onClose={closeStation} outside={false} className={`absolute top-4 z-40 max-h-[calc(100%-2rem)] overflow-y-auto rounded-[14px] ${stationDockSide(state)}`}>{stationDock}</CardFrame>}
      {/* Altura do mapa (top e bottom fixos), como no protótipo: o card rola por dentro e o rodapé com o relato fica sempre visível. */}
      {location && <CardFrame onClose={closeLocation} className={`absolute bottom-4 top-4 z-40 flex ${state.location?.side === 'left' ? 'left-[392px]' : 'right-4'}`}>{location}</CardFrame>}
    </>
  );
};
