import React, { useCallback } from 'react';
import { MapMarker, MapPopup, MapRoute, MarkerContent, useMap } from '@/components/ui/map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { MapPin } from 'lucide-react';
import type { FloodPointResponseDTO, SensorResponseDTO } from '../../types';
import type { StationAnchor } from '../utils/stationResolve';
import { useLocationAnalysis } from '../hooks/useLocationAnalysis';
import type { useMapCards } from '../hooks/useMapCards';
import { popupSide } from '../utils/cardsState';
import { circleCoordinates, lineStyleOf } from '../utils/locationView';
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

const POPUP = 'p-0 border-none shadow-none bg-transparent max-w-none';

const useSide = (lon: number, lat: number, width = 340): 'left' | 'right' => {
  const { map } = useMap();
  if (!map) return 'left';
  return popupSide(map.project([lon, lat]).x, map.getContainer().clientWidth, width);
};

/** Popup ancorado a uma coordenada: abre à direita do marcador e, perto da borda direita, à esquerda. */
const SidePopup: React.FC<{ lon: number; lat: number; label: string; onClose: () => void; children: React.ReactNode }> = ({ lon, lat, label, onClose, children }) => {
  const side = useSide(lon, lat);
  return (
    <MapPopup longitude={lon} latitude={lat} onClose={onClose} className={POPUP} anchor={side === 'left' ? 'left' : 'right'} offset={[side === 'left' ? 34 : -34, 0]} autoPan label={label}>
      {children}
    </MapPopup>
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
  const station = state.station && !state.analysis ? stations.find((s) => s.canonicalId === state.station) : undefined;
  const closePoint = useCallback(() => cards.close('closePoint'), [cards]);
  const closeStation = useCallback(() => cards.close('closeStation'), [cards]);
  const closeRiver = useCallback(() => cards.close('closeRiver'), [cards]);
  return (
    <>
      {merged && !isMobile && (
        <SidePopup lon={merged.longitude} lat={merged.latitude} label={`Resumo do ponto ${merged.name}`} onClose={closePoint}>
          <CardFrame onClose={closePoint}><PointCardContainer point={merged} onClose={closePoint} onOpenAnalysis={() => cards.openAnalysis(merged.slug)} /></CardFrame>
        </SidePopup>
      )}
      {station && station.lat != null && station.lon != null && !isMobile && (
        <SidePopup lon={station.lon} lat={station.lat} label={`Pluviômetro ${station.name ?? station.canonicalId}`} onClose={closeStation}>
          <CardFrame onClose={closeStation}><StationCardContainer id={station.canonicalId as string} onClose={closeStation} onOpenPoint={cards.openPoint} /></CardFrame>
        </SidePopup>
      )}
      {riverSensor && state.river && riverSensor.latitude != null && riverSensor.longitude != null && !isMobile && (
        <SidePopup lon={riverSensor.longitude} lat={riverSensor.latitude} label={`Régua do rio ${riverSensor.riverName ?? riverSensor.stationName ?? ''}`} onClose={closeRiver}>
          <CardFrame onClose={closeRiver}><RiverCardContainer sensor={riverSensor} onClose={closeRiver} /></CardFrame>
        </SidePopup>
      )}
      {state.location && <LocationOverlay lat={state.location.lat} lon={state.location.lon} />}
    </>
  );
};

/** Alfinete, círculo tracejado de 5 km e linhas até as candidatas: cheia = usada, tracejada = menor/sem valor, vermelha = reprovada. */
const LocationOverlay: React.FC<{ lat: number; lon: number }> = ({ lat, lon }) => {
  const q = useLocationAnalysis({ lat, lon });
  const ring = circleCoordinates(lat, lon, 5000);
  return (
    <>
      <MapRoute id="location-radius" coordinates={ring} color="#5cb8ff" width={2} opacity={0.7} dashArray={[3, 3]} interactive={false} />
      {q.data?.rain.candidates.filter((c) => c.lat != null && c.lon != null).map((c) => {
        const st = lineStyleOf(c);
        return <MapRoute key={c.stationId} id={`location-line-${c.stationId}`} coordinates={[[lon, lat], [c.lon as number, c.lat as number]]} color={st.color} width={st.width} dashArray={st.dash} opacity={0.9} interactive={false} />;
      })}
      <MapMarker longitude={lon} latitude={lat} offset={[0, -12]}>
        <MarkerContent>
          <div data-testid="location-pin" className="flex size-6 items-center justify-center rounded-full border-2 border-border bg-primary"><MapPin className="size-3 text-primary-foreground" aria-hidden="true" /></div>
        </MarkerContent>
      </MapMarker>
    </>
  );
};

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
  const stationDock = state.station && (state.analysis || !stationOnMap) && <StationCardContainer id={state.station} onClose={closeStation} onOpenPoint={openPoint} />;
  const location = state.location && (
    <LocationCardContainer lat={state.location.lat} lon={state.location.lon} onClose={closeLocation} onOpenPoint={openPoint} onOpenStation={cards.openStation} onReport={() => onReportAt({ lat: state.location!.lat, lng: state.location!.lon })} />
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
      {stationDock && <CardFrame onClose={closeStation} outside={false} className={`absolute top-4 z-40 ${state.analysis ? 'right-[496px]' : 'right-4'}`}>{stationDock}</CardFrame>}
      {location && <CardFrame onClose={closeLocation} className={`absolute top-4 z-40 max-h-[calc(100%-2rem)] ${state.location?.side === 'left' ? 'left-[392px]' : 'right-4'}`}>{location}</CardFrame>}
    </>
  );
};
