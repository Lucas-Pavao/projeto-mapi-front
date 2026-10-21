import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MapCircle } from '@/components/ui/map';
import type { MapRef } from '@/components/ui/map';
import { useAuth } from '@/hooks/useAuth';
import { List, MapPin } from 'lucide-react';
import { useRiskFill } from '@/components/risk/useRiskFill';
import { useTheme } from '@/hooks/useTheme';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTokenColor } from '@/lib/tokens';
import { SensorSidebar } from './SensorSidebar';
import { SensorDetailCard } from './SensorDetailCard';
import { FloodPointDetailCard } from './FloodPointDetailCard';
import { ReportFloodModal } from './ReportFloodModal';
import { ReportScenarioModal } from './ReportScenarioModal';
import { useMapData } from '../hooks/useMapData';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useFloodPointStatus } from '../hooks/useFloodPointStatus';
import { useFloodReporting } from '../hooks/useFloodReporting';
import { useMapEscape } from '../hooks/useMapEscape';
import { useMapSheetFocus } from '../hooks/useMapSheetFocus';
import { useNotices } from '@/hooks/useNotices';
import { NoticeRegion } from '@/components/ui/notice-region';
import { deriveApiStatus } from '../utils/apiStatus';
import { ApiStatusIndicator } from './ApiStatusIndicator';
import { ApiErrorBanner, EmptyDataNotice } from './ApiStatusBanner';
import { RiskLegend } from '@/components/risk/RiskLegend';
import { TerrainControl } from './TerrainControl';
import { LocationAnalysisCard } from './LocationAnalysisCard';
import { TerrainLayer } from './TerrainLayer';
import { LocationInitializer } from './LocationInitializer';
import { MapLayerPanel } from './MapLayerPanel';
import { MapUserIsland } from './MapUserIsland';
import { MapLoadingOverlay } from './MapLoadingOverlay';
import { GeolocateReportButton } from './GeolocateReportButton';
import { SensorMarkers } from './SensorMarkers';
import { FloodPointMarkers } from './FloodPointMarkers';
import { MapSelectionPopups } from './MapSelectionPopups';
import { DEFAULT_ACTIVE_LAYERS, filterFloodPointsForMap, filterSensorsForMap } from '../utils/layers';
import { collectNearbySensorIds } from '../utils/nearbySensors';
import type { TerrainStatus } from '../utils/terrain';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';

/** Foco do mapa num ponto/sensor: voo suave até a coordenada. */
type FlyTo = (lng: number, lat: number, zoom: number, duration?: number) => void;

/**
 * Tela do mapa de monitoramento. Contêiner: junta dados (useMapData), seleção (useMapInteractions),
 * relatos (useFloodReporting) e compõe os componentes de apresentação.
 */
export const MapView: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { sensors, floodPoints, isLoading, isRefreshing, hasError, lastSuccessAt, refetch } = useMapData();
  const apiStatus = deriveApiStatus({ isLoading, hasError });
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
  // Barra direita do mapa: um painel aberto por vez (camadas, terreno ou legenda).
  const [openTool, setOpenTool] = useState<'layers' | 'terrain' | 'legend' | null>(null);
  const toolProps = (tool: 'layers' | 'terrain' | 'legend') => ({
    open: openTool === tool,
    onOpenChange: (v: boolean) => setOpenTool(v ? tool : null),
  });
  const [showMobileList, setShowMobileList] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<MapRef>(null);
  const flyTo = useCallback<FlyTo>((lng, lat, zoom, duration) => {
    mapRef.current?.flyTo(duration === undefined ? { center: [lng, lat], zoom } : { center: [lng, lat], zoom, duration });
  }, []);

  const reporting = useFloodReporting({ selectedFloodPoint, username: user?.username, notify });
  const { showReportModal, setShowReportModal, showScenarioModal, setShowScenarioModal } = reporting;

  useMapEscape({
    blocked: showDetailCard || showReportModal || showScenarioModal,
    showMobileList,
    closeMobileList: useCallback(() => setShowMobileList(false), []),
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
    if (clickedLocation) return [clickedLocation.lng, clickedLocation.lat];
    if (selectedFloodPoint && selectedFloodPoint.latitude && selectedFloodPoint.longitude) {
      return [selectedFloodPoint.longitude, selectedFloodPoint.latitude];
    }
    return null;
  }, [clickedLocation, selectedFloodPoint]);

  // Cores do paint do MapLibre vêm dos tokens em runtime e seguem tema e destaque.
  const primaryColor = useTokenColor('--primary', '#5cb8ff');
  const selectedRisk =
    (selectedFloodPoint && (floodPointStatus?.floodPrediction?.riskLevel || selectedFloodPoint.floodPrediction?.riskLevel)) || undefined;
  const riskFill = useRiskFill(selectedRisk);
  const circleColor = clickedLocation || !selectedFloodPoint ? primaryColor : riskFill;

  // Celular: a folha inferior cobre até 70 vh; o mapa desloca o marcador para a área livre acima dela.
  const focusLat = selectedFloodPoint?.latitude ?? selectedSensor?.latitude ?? null;
  const focusLng = selectedFloodPoint?.longitude ?? selectedSensor?.longitude ?? null;
  useMapSheetFocus(mapRef, isMobile && focusLat != null && focusLng != null, focusLat, focusLng);

  const nearbySensorIds = useMemo(
    () => collectNearbySensorIds({ locationInfo, floodPointStatus, selectedFloodPoint, sensorStatus }),
    [locationInfo, floodPointStatus, selectedFloodPoint, sensorStatus],
  );

  // Pulso: hoje só HIGH; a F3 troca por "ponto com alerta ativo" (ADR 0011).
  const alertSlugs = useMemo(
    () => new Set(floodPoints.filter((p) => p.floodPrediction?.riskLevel === 'HIGH').map((p) => p.slug)),
    [floodPoints],
  );

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

  return (
    <div className="h-full min-h-0 w-full bg-background overflow-hidden font-sans selection:bg-primary/30 text-foreground relative">
      {/* Estado da conexão com os dados (marca e relógio ficam na Nav) */}
      <div className="absolute top-4 left-4 z-40 pointer-events-auto">
        <div className="flex h-8 items-center rounded-full border border-border bg-card px-3 shadow-elevation-raised">
          <ApiStatusIndicator status={apiStatus} lastSuccessAt={lastSuccessAt} />
        </div>
      </div>

      <MapUserIsland username={user?.username} onLogout={logout} />

      {/* Floating sidebar overlay */}
      <button
        type="button"
        onClick={() => setShowMobileList(true)}
        aria-expanded={showMobileList}
        aria-controls="sensor-sheet"
        className="md:hidden absolute bottom-6 left-4 z-30 flex h-12 items-center gap-2 rounded-full border border-border bg-popover px-4 text-sm font-semibold text-foreground shadow-elevation-overlay"
      >
        <List className="h-5 w-5" aria-hidden="true" />
        Sensores e pontos
      </button>
      <div
        id="sensor-sheet"
        className={cn(
          'absolute z-40 pointer-events-none md:z-20 md:flex md:inset-x-auto md:top-16 md:left-4 md:bottom-4 md:h-auto',
          showMobileList ? 'flex inset-x-2 bottom-2 h-[70vh]' : 'hidden',
        )}
      >
        <div className="pointer-events-auto h-full w-full md:w-auto shadow-elevation-overlay rounded-2xl overflow-hidden border border-border ring-1 ring-border">
          <SensorSidebar
            sensors={sensors}
            floodPoints={floodPoints}
            onSensorClick={(sensor) => {
              setShowMobileList(false);
              handleSensorClick(sensor);
              if (sensor.latitude && sensor.longitude) flyTo(sensor.longitude, sensor.latitude, 15, 2000);
            }}
            onFloodPointClick={(point) => {
              setShowMobileList(false);
              handleFloodPointClick(point);
              if (point.latitude && point.longitude) flyTo(point.longitude, point.latitude, 15, 2000);
            }}
            selectedSensorId={selectedSensorId}
            selectedFloodPointId={selectedFloodPointId}
            onClose={() => setShowMobileList(false)}
          />
        </div>
      </div>

      {/* Avisos de API: erro com horário do último dado válido, ou estado vazio explícito */}
      {(hasError || (!isLoading && sensors.length === 0 && floodPoints.length === 0)) && (
        <div className="absolute top-24 inset-x-4 z-30 md:left-[23rem] md:right-[21rem] md:inset-x-auto pointer-events-auto">
          {hasError ? <ApiErrorBanner lastSuccessAt={lastSuccessAt} isRetrying={isRefreshing} onRetry={refetch} /> : <EmptyDataNotice />}
        </div>
      )}

      <main className="h-full w-full relative">
        <Map ref={mapRef} theme={theme} onClick={handleMapClick} center={[-34.877, -8.057]} zoom={12}>
          <LocationInitializer onLocationUpdate={setUserLocation} />
          <TerrainLayer enabled={showTerrain} onStatusChange={setTerrainStatus} />
          <MapControls
            showLocate
            showFullscreen
            position="bottom-right"
            onLocate={(coords) => setUserLocation({ lat: coords.latitude, lng: coords.longitude })}
            onLocateError={(msg) => notify('error', msg)}
          />

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

          {/* Floating controls overlay (Right) */}
          <div className="pointer-events-none absolute right-4 top-48 bottom-[17rem] md:top-24 md:bottom-[12rem] z-20 flex flex-col items-end gap-3">
            <MapLayerPanel activeLayers={activeLayers} onToggle={toggleLayer} {...toolProps('layers')} />
            <TerrainControl enabled={showTerrain} onChange={setShowTerrain} status={terrainStatus} {...toolProps('terrain')} />
            <RiskLegend {...toolProps('legend')} />
          </div>

          <SensorMarkers sensors={filteredSensorsForMap} selectedSensorId={selectedSensorId} nearbySensorIds={nearbySensorIds} onSelect={selectSensor} />
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
              if (clickedLocation) reporting.askScenarioAt(clickedLocation);
            }}
          />
        )}

        {showDetailCard && selectedSensor && <SensorDetailCard sensor={selectedSensor} status={sensorStatus} onClose={() => setShowDetailCard(false)} />}

        {showDetailCard && selectedFloodPoint && (
          <FloodPointDetailCard
            point={selectedFloodPoint}
            status={floodPointStatus}
            isFetchingStatus={isFetchingStatus}
            onClose={() => setShowDetailCard(false)}
            onReportFlood={() => setShowReportModal(true)}
            onExportCsv={() => reporting.handleExportCsv(selectedFloodPoint)}
            onFocusMap={() => {
              setShowDetailCard(false);
              flyTo(selectedFloodPoint.longitude, selectedFloodPoint.latitude, 16);
            }}
          />
        )}

        {isLoading && <MapLoadingOverlay />}

        {showReportModal && selectedFloodPoint && (
          <ReportFloodModal
            point={selectedFloodPoint}
            severity={reporting.reportSeverity}
            description={reporting.reportDescription}
            isSubmitting={reporting.isSubmittingReport}
            onSeverityChange={reporting.setReportSeverity}
            onDescriptionChange={reporting.setReportDescription}
            onConfirm={reporting.handleReportFlood}
            onClose={() => setShowReportModal(false)}
          />
        )}

        {showScenarioModal && reporting.scenarioCoords && (
          <ReportScenarioModal
            latitude={reporting.scenarioCoords.lat}
            longitude={reporting.scenarioCoords.lng}
            isSubmitting={reporting.isSubmittingScenario}
            title={reporting.scenarioTitle}
            onConfirm={reporting.handleConfirmScenario}
            onClose={() => setShowScenarioModal(false)}
          />
        )}

        <GeolocateReportButton
          isGettingLocation={reporting.isGettingLocation}
          hiddenOnSmall={Boolean(clickedLocation || isFetchingLocation)}
          onClick={reporting.handleGetGeolocation}
        />
      </main>
      <NoticeRegion notices={notices} onDismiss={dismiss} className="max-[640px]:bottom-auto max-[640px]:top-[68px]" />
    </div>
  );
};

export default MapView;
