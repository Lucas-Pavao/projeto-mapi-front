import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MapCircle } from '@/components/ui/map';
import type { MapRef } from '@/components/ui/map';
import { useAuth } from '@/hooks/useAuth';
import { MapPin } from 'lucide-react';
import { useRiskFill } from '@/components/risk/useRiskFill';
import { useTheme } from '@/hooks/useTheme';
import { useIsCompactMap } from '@/hooks/useMediaQuery';
import { useTokenColor } from '@/lib/tokens';
import { LivePanel } from './LivePanel';
import { RainTideCard } from './RainTideCard';
import { TideMarker } from './TideMarker';
import { MobileMapa } from './MobileMapa';
import { MobilePointSheet } from './MobilePointSheet';
import { MobileReportFlow } from './MobileReportFlow';
import { useMapOverview } from '../hooks/useMapOverview';
import { sortPoints } from '../utils/overview';
import { SensorDetailCard } from './SensorDetailCard';
import { ReportFloodModal } from './ReportFloodModal';
import { useMapData } from '../hooks/useMapData';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useFloodPointStatus } from '../hooks/useFloodPointStatus';
import { useFloodReporting } from '../hooks/useFloodReporting';
import { useMapEscape } from '../hooks/useMapEscape';
import { useMapSheetFocus } from '../hooks/useMapSheetFocus';
import { useMapLive } from '../hooks/useMapLive';
import { hasRole, parseRole } from '@/lib/roles';
import { useNotices } from '@/hooks/useNotices';
import { NoticeRegion } from '@/components/ui/notice-region';
import { ApiErrorBanner, EmptyDataNotice } from './ApiStatusBanner';
import { RiskLegend } from '@/components/risk/RiskLegend';
import { TerrainControl } from './TerrainControl';
import { LocationAnalysisCard } from './LocationAnalysisCard';
import { TerrainLayer } from './TerrainLayer';
import { LocationInitializer } from './LocationInitializer';
import { MapLayerPanel } from './MapLayerPanel';
import { MapLoadingOverlay } from './MapLoadingOverlay';
import { GeolocateReportButton } from './GeolocateReportButton';
import { SensorMarkers } from './SensorMarkers';
import { FloodPointMarkers } from './FloodPointMarkers';
import { MapSelectionPopups } from './MapSelectionPopups';
import { DEFAULT_ACTIVE_LAYERS, filterFloodPointsForMap, filterSensorsForMap } from '../utils/layers';
import { collectNearbySensorIds } from '../utils/nearbySensors';
import type { TerrainStatus } from '../utils/terrain';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';

/** Foco do mapa num ponto/sensor: voo suave até a coordenada. */
type FlyTo = (lng: number, lat: number, zoom: number, duration?: number) => void;

/**
 * Tela do mapa de monitoramento. Contêiner: junta dados (useMapData), seleção (useMapInteractions),
 * relatos (useFloodReporting) e compõe os componentes de apresentação.
 */
export const MapView: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isMobile = useIsCompactMap();
  const { sensors, floodPoints, isLoading, isRefreshing, hasError, lastSuccessAt, refetch, applyPrediction } = useMapData();
  const { notices, notify, dismiss } = useNotices();
  const {
    selectedSensorId,
    selectedFloodPointId,
    selectedSensor,
    selectedFloodPoint,
    showDetailCard,
    setShowDetailCard,
    clickedLocation,
    locationInfo,
    nearestHarbor,
    isFetchingLocation,
    floodPointStatus,
    setFloodPointStatus,
    sensorStatus,
    isFetchingStatus,
    setIsFetchingStatus,
    handleMapClick,
    handleSensorClick,
    handleFloodPointClick,
    closePopups,
  } = useMapInteractions(sensors, floodPoints);

  const [activeLayers, setActiveLayers] = useState<string[]>([...DEFAULT_ACTIVE_LAYERS]);
  const [showTerrain, setShowTerrain] = useState(false);
  const [terrainStatus, setTerrainStatus] = useState<TerrainStatus>('off');
  // Ferramentas do mapa (desktop): um painel aberto por vez (camadas ou terreno).
  const [openTool, setOpenTool] = useState<'layers' | 'terrain' | null>(null);
  const toolProps = (tool: 'layers' | 'terrain') => ({
    open: openTool === tool,
    onOpenChange: (v: boolean) => setOpenTool(v ? tool : null),
  });
  // Relato em etapas do celular; `point` é o ponto crítico de onde partiu (posição de reserva).
  const [wizard, setWizard] = useState<{ point?: FloodPointResponseDTO } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<MapRef>(null);
  const flyTo = useCallback<FlyTo>((lng, lat, zoom, duration) => {
    mapRef.current?.flyTo(duration === undefined ? { center: [lng, lat], zoom } : { center: [lng, lat], zoom, duration });
  }, []);

  const reporting = useFloodReporting({ notify });

  useMapEscape({
    blocked: showDetailCard || reporting.reportTarget !== null || wizard !== null,
    openTool,
    closeTool: useCallback(() => setOpenTool(null), []),
    closePopups,
  });

  // Status em tempo real quando um ponto crítico é selecionado
  useFloodPointStatus({ point: selectedFloodPoint, setStatus: setFloodPointStatus, setIsFetching: setIsFetchingStatus, notify });

  const toggleLayer = useCallback(
    (id: string) => setActiveLayers((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id])),
    [],
  );
  const filteredSensorsForMap = useMemo(() => filterSensorsForMap(sensors, activeLayers), [sensors, activeLayers]);
  const filteredFloodPointsForMap = useMemo(() => filterFloodPointsForMap(floodPoints, activeLayers), [floodPoints, activeLayers]);

  // Highlighting logic
  const circleCenter = useMemo<[number, number] | null>(() => {
    // Só o local tocado ganha a zona de análise; o ponto crítico selecionado fica limpo, como no protótipo.
    if (clickedLocation) return [clickedLocation.lng, clickedLocation.lat];
    return null;
  }, [clickedLocation]);

  // Cores do paint do MapLibre vêm dos tokens em runtime e seguem tema e destaque.
  const primaryColor = useTokenColor('--primary', '#5cb8ff');
  const selectedRisk =
    (selectedFloodPoint && (floodPointStatus?.floodPrediction?.riskLevel || selectedFloodPoint.floodPrediction?.riskLevel)) || undefined;
  const riskFill = useRiskFill(selectedRisk);
  const circleColor = clickedLocation || !selectedFloodPoint ? primaryColor : riskFill;

  // Celular: a folha inferior cobre até 70 vh; o mapa desloca o marcador para a área livre acima dela.
  const focusLat = selectedFloodPoint?.latitude ?? selectedSensor?.latitude ?? null;
  const focusLng = selectedFloodPoint?.longitude ?? selectedSensor?.longitude ?? null;
  useMapSheetFocus(mapRef, isMobile && focusLat != null && focusLng != null, focusLat, focusLng, selectedFloodPoint ? 640 : undefined);

  const nearbySensorIds = useMemo(
    () => collectNearbySensorIds({ locationInfo, floodPointStatus, selectedFloodPoint, sensorStatus }),
    [locationInfo, floodPointStatus, selectedFloodPoint, sensorStatus],
  );

  // Ao vivo (ADR 0012): contagem por risco e previsões novas; o pulso do marcador segue o alerta ativo (ADR 0011).
  const overview = useMapOverview();
  const { riskSummary, riskSummaryFailed, liveStatus, alertSlugs } = useMapLive({
    applyPrediction,
    canSeeAlerts: hasRole(parseRole(user?.role), 'OPERADOR'),
  });

  const selectSensor = useCallback(
    (sensor: SensorResponseDTO) => {
      handleSensorClick(sensor);
      if (sensor.latitude && sensor.longitude) flyTo(sensor.longitude, sensor.latitude, 13.5, 1500);
    },
    [handleSensorClick, flyTo],
  );
  const selectFloodPoint = useCallback(
    (point: FloodPointResponseDTO) => {
      handleFloodPointClick(point);
      if (point.latitude && point.longitude) flyTo(point.longitude, point.latitude, 13.5, 1500);
    },
    [handleFloodPointClick, flyTo],
  );

  const sortedPoints = useMemo(() => sortPoints(floodPoints), [floodPoints]);
  const selectedIndex = selectedFloodPoint ? sortedPoints.findIndex((p) => p.id === selectedFloodPoint.id) : -1;
  const stepPoint = (delta: number) => {
    if (sortedPoints.length === 0) return;
    selectFloodPoint(sortedPoints[(Math.max(selectedIndex, 0) + delta + sortedPoints.length) % sortedPoints.length]);
  };
  const isAdmin = hasRole(parseRole(user?.role), 'ADMIN');

  return (
    <div className="h-full min-h-0 w-full bg-background overflow-hidden font-sans selection:bg-primary/30 text-foreground relative">
      {/* Desktop: painel "Agora na RMR" à esquerda (360 px, a 16 px das bordas) e cartão de chuva e maré à direita (300 px). */}
      {!isMobile && (
        <>
          <LivePanel
            className="absolute bottom-4 left-4 top-4 z-20 w-[360px]"
            points={floodPoints}
            sensors={sensors}
            summary={riskSummary}
            summaryFailed={riskSummaryFailed}
            liveStatus={liveStatus}
            lastSuccessAt={lastSuccessAt}
            overview={overview}
            selectedFloodPointId={selectedFloodPointId}
            selectedSensorId={selectedSensorId}
            onFloodPointClick={selectFloodPoint}
            onSensorClick={selectSensor}
            canSeeDataHealth={isAdmin}
          />
          {/* Coluna direita: cartão de chuva e maré, ferramentas do mapa e, no pé, a legenda. Tudo na mesma coluna para nada
              se sobrepor em telas baixas: sem espaço, a legenda encolhe e rola em vez de cobrir os botões. */}
          <div className="pointer-events-none absolute bottom-4 right-4 top-4 z-30 flex w-[300px] flex-col items-end gap-3">
            <RainTideCard overview={overview} className="pointer-events-auto flex w-full shrink-0 flex-col gap-2 p-3.5" />
            <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-3">
              <MapLayerPanel activeLayers={activeLayers} onToggle={toggleLayer} {...toolProps('layers')} />
              <TerrainControl enabled={showTerrain} onChange={setShowTerrain} status={terrainStatus} {...toolProps('terrain')} />
            </div>
            <RiskLegend showExperimentalNote={false} className="custom-scrollbar pointer-events-auto mt-auto min-h-0 w-full overflow-y-auto overscroll-contain" />
          </div>
        </>
      )}

      {/* Avisos de API: erro com horário do último dado válido, ou estado vazio explícito */}
      {(hasError || (!isLoading && sensors.length === 0 && floodPoints.length === 0)) && (
        <div className="absolute inset-x-4 top-[88px] z-30 pointer-events-auto lg:inset-x-auto lg:left-[392px] lg:right-[332px] lg:top-4">
          {hasError ? <ApiErrorBanner lastSuccessAt={lastSuccessAt} isRetrying={isRefreshing} onRetry={refetch} /> : <EmptyDataNotice />}
        </div>
      )}

      <main className="h-full w-full relative">
        <Map ref={mapRef} theme={theme} onClick={handleMapClick} center={[-34.877, -8.057]} zoom={12}>
          <LocationInitializer onLocationUpdate={setUserLocation} />
          <TerrainLayer enabled={showTerrain} onStatusChange={setTerrainStatus} />
          {!isMobile && (
            <MapControls
              showLocate
              showFullscreen
              position="bottom-left"
              className="bottom-10 left-[392px]"
              onLocate={(coords) => setUserLocation({ lat: coords.latitude, lng: coords.longitude })}
              onLocateError={(msg) => notify('error', msg)}
            />
          )}

          {userLocation && (
            <MapMarker longitude={userLocation.lng} latitude={userLocation.lat}>
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 bg-chart-1 rounded-full animate-ping" />
                  <div className="relative w-4 h-4 bg-chart-1 border-2 border-border rounded-full" />
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {circleCenter && (
            <MapCircle center={circleCenter} radiusKm={3} color={circleColor} opacity={0.1} strokeColor={circleColor} strokeWidth={2} strokeOpacity={0.4} />
          )}

          <SensorMarkers
            sensors={filteredSensorsForMap}
            selectedSensorId={selectedSensorId}
            nearbySensorIds={nearbySensorIds}
            floodPoints={filteredFloodPointsForMap}
            onSelect={selectSensor}
          />
          {!isMobile && overview.tideNow && <TideMarker tide={overview.tideNow} />}
          <FloodPointMarkers
            points={filteredFloodPointsForMap}
            selectedFloodPointId={selectedFloodPointId}
            selectedRisk={selectedRisk}
            alertSlugs={alertSlugs}
            onSelect={selectFloodPoint}
          />

          <MapSelectionPopups
            isMobile={isMobile}
            selectedSensor={selectedSensor}
            sensorStatus={sensorStatus}
            selectedFloodPoint={selectedFloodPoint}
            floodPointStatus={floodPointStatus}
            isFetchingStatus={isFetchingStatus}
            onShowDetails={() => setShowDetailCard(true)}
            onClose={closePopups}
          />

          {clickedLocation && (
            <MapMarker longitude={clickedLocation.lng} latitude={clickedLocation.lat} offset={[0, -12]}>
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping opacity-30" />
                  <div className="h-6 w-6 rounded-full border-2 border-border bg-primary flex items-center justify-center relative z-10">
                    <MapPin className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
              </MarkerContent>
            </MapMarker>
          )}
        </Map>

        {(clickedLocation || isFetchingLocation) && (
          <LocationAnalysisCard
            coords={clickedLocation}
            loading={isFetchingLocation}
            info={locationInfo}
            harborName={(nearestHarbor?.harbor_name as string | undefined) ?? null}
            onClose={() => closePopups()}
            onSensorSelect={(reading) => {
              const fullSensor = sensors.find((s) => s.sensorId === reading.sensorId);
              if (fullSensor) {
                handleSensorClick(fullSensor);
                if (fullSensor.latitude && fullSensor.longitude) flyTo(fullSensor.longitude, fullSensor.latitude, 16);
              }
            }}
            onReport={() => {
              if (clickedLocation) reporting.openReportAt(clickedLocation);
            }}
          />
        )}

        {showDetailCard && selectedSensor && <SensorDetailCard sensor={selectedSensor} status={sensorStatus} onClose={() => setShowDetailCard(false)} />}

        {isLoading && <MapLoadingOverlay />}

        {reporting.reportTarget && (
          <ReportFloodModal
            target={reporting.reportTarget}
            submitting={reporting.isSubmittingReport}
            error={reporting.reportError}
            onSubmit={reporting.submitReport}
            onClose={reporting.closeReport}
          />
        )}

        {!isMobile && (
          <GeolocateReportButton
            isGettingLocation={reporting.isGettingLocation}
            hiddenOnSmall={Boolean(clickedLocation || isFetchingLocation)}
            onClick={reporting.handleGetGeolocation}
          />
        )}
      </main>

      {isMobile && (
        <>
          <MobileMapa
            points={floodPoints}
            summary={riskSummary}
            summaryFailed={riskSummaryFailed}
            overview={overview}
            lastSuccessAt={lastSuccessAt}
            onSelect={selectFloodPoint}
            onReport={() => setWizard({})}
            hidden={selectedFloodPointId !== undefined || selectedSensorId !== undefined || Boolean(clickedLocation || isFetchingLocation)}
          />
          {selectedFloodPoint && (
            <MobilePointSheet
              key={selectedFloodPoint.id}
              point={selectedFloodPoint}
              status={floodPointStatus}
              isFetchingStatus={isFetchingStatus}
              index={Math.max(selectedIndex, 0)}
              total={sortedPoints.length}
              onPrev={() => stepPoint(-1)}
              onNext={() => stepPoint(1)}
              onBack={closePopups}
              onReport={() => setWizard({ point: selectedFloodPoint })}
            />
          )}
          {wizard && <MobileReportFlow fallbackPoint={wizard.point} points={floodPoints} send={reporting.sendReport} onClose={() => setWizard(null)} />}
        </>
      )}
      <NoticeRegion notices={notices} onDismiss={dismiss} className="max-[1023px]:bottom-auto! max-[1023px]:top-[116px]!" />
    </div>
  );
};

export default MapView;
