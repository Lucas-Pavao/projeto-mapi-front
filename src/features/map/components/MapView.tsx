import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MapPopup, MapCircle, useMap } from '@/components/ui/map';
import type { MapRef } from '@/components/ui/map';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  User, 
  Layers, 
  List,
  Shield, 
  Activity,
  AlertTriangle,
  Waves,
  CloudRain,
  Thermometer,
  Wind,
  MapPin,
  RefreshCw
} from 'lucide-react';

import { exportService } from '../services/export.service';
import { floodService } from '../services/flood.service';
import { mapService } from '../services/map.service';
import { getSensorConfig, getDataFreshness, formatApiTimestamp } from '../utils/sensor';
import { getRiskVisual } from '../utils/risk';
import { RiskBadge } from './RiskBadge';
import { SensorSidebar } from './SensorSidebar';
import { SensorPopup } from './SensorPopup';
import { FloodPointPopup } from './FloodPointPopup';
import { SensorDetailCard } from './SensorDetailCard';
import { FloodPointDetailCard } from './FloodPointDetailCard';
import { ReportFloodModal } from './ReportFloodModal';
import { ReportScenarioModal } from './ReportScenarioModal';
import { useMapData } from '../hooks/useMapData';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useNotices } from '@/hooks/useNotices';
import { NoticeRegion } from '@/components/ui/notice-region';
import { deriveApiStatus } from '../utils/apiStatus';
import { ApiStatusIndicator } from './ApiStatusIndicator';
import { ApiErrorBanner, EmptyDataNotice } from './ApiStatusBanner';
import { RiskLegend } from './RiskLegend';
import { TerrainControl } from './TerrainControl';
import { MapToolPopover } from './MapToolPopover';
import { LocationAnalysisCard } from './LocationAnalysisCard';
import { TerrainLayer } from './TerrainLayer';
import type { TerrainStatus } from '../utils/terrain';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO, FloodPointResponseDTO, PreciseDataResponse } from '../types';

/**
 * Component to request user geolocation when the map is loaded and fly to it.
 */
const LocationInitializer: React.FC<{ onLocationUpdate: (loc: {lat: number, lng: number}) => void }> = ({ onLocationUpdate }) => {
  const { map, isLoaded } = useMap();
  const hasInitialized = useRef(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (isLoaded && map && !hasInitialized.current) {
      hasInitialized.current = true;
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onLocationUpdate({ lat: latitude, lng: longitude });
            map.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              duration: 2000
            });
            
            watchId.current = navigator.geolocation.watchPosition(
              (pos) => {
                onLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              },
              (err) => console.warn("Could not watch user location:", err.message),
              { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
          },
          (error) => {
            console.warn("Could not retrieve user location on initial load:", error.message || "Unknown error");
            // Se falhar o getCurrentPosition, tenta o watchPosition mesmo assim
            watchId.current = navigator.geolocation.watchPosition(
              (pos) => {
                onLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              },
              (err) => console.warn("Could not watch user location:", err.message),
              { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isLoaded, map, onLocationUpdate]);

  return null;
};

/**
 * Main View for the Map Monitoring System
 */
export const MapView: React.FC = () => {
  const { user, logout } = useAuth();
  const { sensors, floodPoints, isLoading, isRefreshing, hasError, lastSuccessAt, refetch } = useMapData();
  const apiStatus = deriveApiStatus({ isLoading, hasError });
  const { notices, notify, dismiss } = useNotices();
  const {
    selectedSensorId,
    setSelectedSensorId,
    selectedFloodPointId,
    setSelectedFloodPointId,
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
    closePopups
  } = useMapInteractions(sensors, floodPoints);

  const [activeLayers, setActiveLayers] = useState<string[]>(['Mista / Meteo', 'Geotécnica', 'Rio / Hidro', 'Chuva', 'Pontos Críticos', 'Meteo', 'Vento', 'Sensor']);
  const [showTerrain, setShowTerrain] = useState(false);
  const [terrainStatus, setTerrainStatus] = useState<TerrainStatus>('off');
  // Barra direita do mapa: um painel aberto por vez (camadas, terreno ou legenda).
  const [openTool, setOpenTool] = useState<'layers' | 'terrain' | 'legend' | null>(null);
  const toolProps = (tool: 'layers' | 'terrain' | 'legend') => ({
    open: openTool === tool,
    onOpenChange: (v: boolean) => setOpenTool(v ? tool : null),
  });
  const [showMobileList, setShowMobileList] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSeverity, setReportSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioCoords, setScenarioCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [isSubmittingScenario, setIsSubmittingScenario] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const mapRef = useRef<MapRef>(null);

  // Esc: fecha, em ordem, lista (celular) > painel de camadas > popups/painel de local.
  // Modais e popups tratam o próprio Esc; os modais interrompem a propagação.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || showDetailCard || showReportModal || showScenarioModal) return;
      if (showMobileList) setShowMobileList(false);
      else if (openTool) setOpenTool(null);
      else closePopups();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showDetailCard, showReportModal, showScenarioModal, showMobileList, openTool, closePopups]);

  // Fetch real-time status when a flood point is selected
  useEffect(() => {
    if (selectedFloodPoint?.slug) {
      let isMounted = true;
      const fetchStatus = async () => {
        setIsFetchingStatus(true);
        try {
          // Fetch BOTH point status (for sensor config) and rich analysis (for fallbacks)
          const [pointData, preciseAnalysis] = await Promise.all([
            floodService.getPointStatus(selectedFloodPoint.slug),
            floodService.getPreciseData(selectedFloodPoint.latitude, selectedFloodPoint.longitude)
          ]);
          
          // Normalize data: FloodPointResponseDTO has liveData, MapiResponseDTO has preciseData.
          // We prioritize the point-specific liveData if available.
          const data: PreciseDataResponse = {
            ...preciseAnalysis,
            preciseData: pointData.liveData || preciseAnalysis.preciseData,
            floodPrediction: pointData.floodPrediction || preciseAnalysis.floodPrediction,
            // Keep nearestSensor and openMeteoData from preciseAnalysis as they are useful fallbacks
          };
          
          // Augment with individual sensor data if metrics are still missing
          if (isMounted) {
            const sensorIds = pointData.nearbySensorIds || [];
            if (sensorIds.length > 0) {
              const sensorReadings = await Promise.all(
                sensorIds.map(async (id) => {
                  try {
                    const s = await mapService.getLatestBySensorId(id);
                    return s;
                  } catch {
                    return null;
                  }
                })
              );
              
              const validSensors = sensorReadings.filter((s): s is SensorResponseDTO => s !== null);
              
              if (validSensors.length > 0) {
                if (!data.preciseData) {
                  data.preciseData = {
                    source: 'Individual Sensors',
                    timestamp: new Date().toISOString(),
                    latestReadings: [],
                    precipitation: null,
                    temperature: null,
                    humidity: null,
                    pressure: null,
                    windSpeed: null,
                    waterLevel: null,
                    flowRate: null,
                    tideHeight: null,
                    waveHeight: null,
                    waveDirection: null,
                    wavePeriod: null,
                    tideHeightTabuaMare: null,
                    solarRadiation: null,
                    unitPrecipitation: null,
                    unitTemperature: null,
                    unitWaterLevel: null,
                    unitTide: null,
                    unitWave: null,
                    unitWindSpeed: null,
                    unitPressure: null,
                    unitSolarRadiation: null,
                    unitFlowRate: null,
                    message: 'Dados consolidados via consulta individual.'
                  };
                }

                // If the list of readings is empty, populate it
                if (!data.preciseData.latestReadings || data.preciseData.latestReadings.length === 0) {
                  data.preciseData.latestReadings = validSensors.map(s => ({
                    sensorId: s.sensorId,
                    value: s.value || 0,
                    unit: s.unit || '',
                    type: s.type || 'Sensor',
                    timestamp: formatApiTimestamp(s.timestamp),
                    latitude: s.latitude || 0,
                    longitude: s.longitude || 0,
                    distanceKm: 0
                  }));
                }

                // Backfill missing top-level metrics from individual sensors
                validSensors.forEach(s => {
                  if (data.preciseData.temperature == null) data.preciseData.temperature = s.temperature;
                  if (data.preciseData.humidity == null) data.preciseData.humidity = s.humidity;
                  if (data.preciseData.pressure == null) data.preciseData.pressure = s.pressure;
                  if (data.preciseData.windSpeed == null) data.preciseData.windSpeed = s.windSpeed;
                  if (data.preciseData.precipitation == null) data.preciseData.precipitation = s.accumulatedPrecipitation;
                  if (data.preciseData.waterLevel == null) data.preciseData.waterLevel = s.waterLevel;
                  if (data.preciseData.flowRate == null) data.preciseData.flowRate = s.flowRate;
                  if (data.preciseData.tideHeight == null) data.preciseData.tideHeight = s.tideHeight ?? null;
                });
              }
            }
          }

          if (isMounted) setFloodPointStatus(data);
        } catch (error) {
          console.error('Erro ao buscar status do ponto:', error);
          if (isMounted) notify('error', 'Não foi possível carregar o status em tempo real deste ponto. Os dados exibidos podem estar incompletos.');
        } finally {
          if (isMounted) setIsFetchingStatus(false);
        }
      };
      fetchStatus();
      return () => { 
        isMounted = false;
        setFloodPointStatus(null);
      };
    }
  }, [selectedFloodPoint?.slug, selectedFloodPoint?.latitude, selectedFloodPoint?.longitude, setIsFetchingStatus, setFloodPointStatus, notify]);

  const handleExportCsv = async (point: FloodPointResponseDTO) => {
    try {
      const csvData = await exportService.getUnifiedIADataCsv(point.slug);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `dataset_${point.slug}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      notify('error', 'Erro ao exportar dados para CSV.');
    }
  };

  const handleReportFlood = async () => {
    if (!selectedFloodPoint) return;

    setIsSubmittingReport(true);
    try {
      await floodService.reportFlood({
        floodPointSlug: selectedFloodPoint.slug,
        severity: reportSeverity,
        description: reportDescription,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(), // 1h default
        confirmedBy: user?.username || 'Operador'
      });
      notify('success', 'Evento de alagamento registrado com sucesso.');
      setShowReportModal(false);
      setReportDescription('');
    } catch (error) {
      console.error('Erro ao reportar alagamento:', error);
      notify('error', 'Erro ao registrar evento.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleGetGeolocation = () => {
    if (!navigator.geolocation) {
      notify('error', 'Geolocalização não é suportada ou disponível neste navegador (verifique se está acessando via HTTPS ou localhost).');
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setScenarioCoords({ lat: latitude, lng: longitude });
        setScenarioTitle('A região onde você está se encontra alagada agora?');
        setShowScenarioModal(true);
        setIsGettingLocation(false);
      },
      (error) => {
        console.warn('Erro de geolocalização:', error.message || "Unknown error");
        setIsGettingLocation(false);
        
        let msg = 'Não foi possível obter sua geolocalização. ';
        if (error.code === error.PERMISSION_DENIED) {
          msg += 'Permissão negada. Por favor, libere o acesso à localização nas configurações do seu navegador para este site.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg += 'A informação de localização está indisponível.';
        } else if (error.code === error.TIMEOUT) {
          msg += 'O tempo limite expirou ao tentar buscar a localização.';
        } else {
          msg += 'Verifique as permissões de geolocalização do seu navegador.';
        }
        notify('error', msg);
      },
      { enableHighAccuracy: false, timeout: 15000 }
    );
  };

  const handleConfirmScenario = async (isFlooded: boolean) => {
    if (!scenarioCoords) return;
    
    setIsSubmittingScenario(true);
    try {
      await floodService.reportScenario({
        latitude: scenarioCoords.lat,
        longitude: scenarioCoords.lng,
        isFlooded
      });
      notify('success', 'Situação da região reportada com sucesso.');
      setShowScenarioModal(false);
      setScenarioCoords(null);
    } catch (error) {
      console.error('Erro ao reportar cenário:', error);
      notify('error', 'Erro ao enviar o relato do cenário.');
    } finally {
      setIsSubmittingScenario(false);
    }
  };


  const filteredSensorsForMap = useMemo(() => {
    if (!Array.isArray(sensors)) return [];
    return sensors.filter(sensor => {
      if (!sensor || sensor.latitude == null || sensor.longitude == null || 
          (sensor.latitude === 0 && sensor.longitude === 0)) return false;
      const config = getSensorConfig(sensor);
      return activeLayers.includes(config.label);
    });
  }, [sensors, activeLayers]);

  const filteredFloodPointsForMap = useMemo(() => {
    if (!Array.isArray(floodPoints) || !activeLayers.includes('Pontos Críticos')) return [];
    return floodPoints.filter(point => 
      point.latitude != null && point.longitude != null && 
      point.latitude !== 0 && point.longitude !== 0
    );
  }, [floodPoints, activeLayers]);

  // Highlighting logic
  const circleCenter = useMemo<[number, number] | null>(() => {
    if (clickedLocation) return [clickedLocation.lng, clickedLocation.lat];
    if (selectedFloodPoint && selectedFloodPoint.latitude && selectedFloodPoint.longitude) {
      return [selectedFloodPoint.longitude, selectedFloodPoint.latitude];
    }
    return null;
  }, [clickedLocation, selectedFloodPoint]);

  const circleColor = useMemo(() => {
    if (clickedLocation) return "#5cb8ff"; // Primary color for clicked location
    
    if (selectedFloodPoint) {
      // Prioritize the real-time status prediction, fallback to point prediction
      const riskLevel = floodPointStatus?.floodPrediction?.riskLevel || selectedFloodPoint.floodPrediction?.riskLevel;
      return getRiskVisual(riskLevel).hex;
    }
    
    return "#5cb8ff";
  }, [clickedLocation, selectedFloodPoint, floodPointStatus]);

  const nearbySensorIds = useMemo(() => {
    const ids = new Set<string>();
    
    // From clicked location info
    if (locationInfo?.preciseData?.sensorIds) {
      locationInfo.preciseData.sensorIds.forEach(id => ids.add(id));
    }
    if (locationInfo?.preciseData?.latestReadings) {
      locationInfo.preciseData.latestReadings.forEach(d => ids.add(d.sensorId));
    }
    
    // From selected flood point status
    if (floodPointStatus?.preciseData?.sensorIds) {
      floodPointStatus.preciseData.sensorIds.forEach(id => ids.add(id));
    }
    if (floodPointStatus?.preciseData?.latestReadings) {
      floodPointStatus.preciseData.latestReadings.forEach(d => ids.add(d.sensorId));
    }

    // From selected flood point itself
    if (selectedFloodPoint?.nearbySensorIds) {
      selectedFloodPoint.nearbySensorIds.forEach(id => ids.add(id));
    }

    // From selected sensor status
    if (sensorStatus?.preciseData?.sensorIds) {
      sensorStatus.preciseData.sensorIds.forEach(id => ids.add(id));
    }
    if (sensorStatus?.preciseData?.latestReadings) {
      sensorStatus.preciseData.latestReadings.forEach(d => ids.add(d.sensorId));
    }

    return ids;
  }, [locationInfo, floodPointStatus, selectedFloodPoint, sensorStatus]);

  return (
    <div className="h-screen w-full bg-zinc-950 overflow-hidden font-sans selection:bg-primary/30 text-zinc-300 relative">
      {/* Brand Floating Island */}
      <div className="absolute top-4 left-4 z-40 pointer-events-auto">
        <div className="h-16 border border-white/10 bg-black/60 backdrop-blur-xl flex items-center px-3 sm:px-6 rounded-2xl shadow-2xl shadow-black/50 transition-all duration-500 hover:bg-black/60">
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">MAPI Portal</h1>
            <ApiStatusIndicator status={apiStatus} lastSuccessAt={lastSuccessAt} />
          </div>
        </div>
      </div>

      {/* User Controls Floating Island */}
      <div className="absolute top-4 right-4 z-40 pointer-events-auto">
        <div className="h-16 border border-white/10 bg-black/60 backdrop-blur-xl flex items-center gap-3 px-4 rounded-2xl shadow-2xl shadow-black/50 hover:bg-black/60 transition-all">
           <div className="flex flex-col items-end mr-1 hidden sm:flex">
              <span className="text-2xs font-black text-white uppercase tracking-tighter">{user?.username || 'Convidado'}</span>
           </div>
           <div aria-hidden="true" className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group">
              <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
           </div>
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={logout}
             aria-label="Sair da conta"
             title="Sair da conta"
             className="h-10 w-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-zinc-400 transition-all border border-transparent hover:border-red-500/20"
           >
             <LogOut className="h-5 w-5" aria-hidden="true" />
           </Button>
        </div>
      </div>

      {/* Floating Sidebar Overlay */}
      <button
        type="button"
        onClick={() => setShowMobileList(true)}
        aria-expanded={showMobileList}
        aria-controls="sensor-sheet"
        className="md:hidden absolute bottom-6 left-4 z-30 flex h-12 items-center gap-2 rounded-full border border-white/20 bg-black/80 px-4 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl"
      >
        <List className="h-5 w-5" aria-hidden="true" />
        Sensores e pontos
      </button>
      <div
        id="sensor-sheet"
        className={cn(
          'absolute z-40 pointer-events-none md:z-20 md:flex md:inset-x-auto md:top-24 md:left-4 md:bottom-4 md:h-auto',
          showMobileList ? 'flex inset-x-2 bottom-2 h-[70vh]' : 'hidden'
        )}
      >
        <div className="pointer-events-auto h-full w-full md:w-auto shadow-2xl shadow-black/60 rounded-2xl overflow-hidden border border-white/10 ring-1 ring-white/5">
          <SensorSidebar 
            sensors={sensors} 
            floodPoints={floodPoints}
            onSensorClick={(sensor) => {
              setShowMobileList(false);
              handleSensorClick(sensor);
              if (sensor.latitude && sensor.longitude) {
                mapRef.current?.flyTo({
                  center: [sensor.longitude, sensor.latitude],
                  zoom: 15,
                  duration: 2000
                });
              }
            }}
            onFloodPointClick={(point) => {
              setShowMobileList(false);
              handleFloodPointClick(point);
              if (point.latitude && point.longitude) {
                mapRef.current?.flyTo({
                  center: [point.longitude, point.latitude],
                  zoom: 15,
                  duration: 2000
                });
              }
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
          {hasError ? (
            <ApiErrorBanner lastSuccessAt={lastSuccessAt} isRetrying={isRefreshing} onRetry={refetch} />
          ) : (
            <EmptyDataNotice />
          )}
        </div>
      )}
      
      <main className="h-full w-full relative">
        <Map
          ref={mapRef}
          theme="dark"
          onClick={handleMapClick}
          center={[-34.877, -8.057]}
          zoom={12}
        >
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
            <MapMarker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
            >
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping" />
                  <div className="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                </div>
              </MarkerContent>
            </MapMarker>
          )}
          
          {circleCenter && (
            <MapCircle 
              center={circleCenter} 
              radiusKm={3} 
              color={circleColor} 
              opacity={0.1} 
              strokeColor={circleColor} 
              strokeWidth={2}
              strokeOpacity={0.4}
            />
          )}

          {/* Floating Controls Overlay (Right) */}
          <div className="pointer-events-none absolute right-4 top-48 bottom-[17rem] md:top-24 md:bottom-[12rem] z-20 flex flex-col items-end gap-3">
            <MapToolPopover id="layer-panel" label="Camadas do mapa" icon={<Layers className="h-5 w-5" aria-hidden="true" />} panelClassName="w-56 p-1.5" {...toolProps('layers')}>
              <div role="group" aria-label="Camadas" className="flex flex-col gap-1 pt-1">
                   {[
                     { id: 'Mista / Meteo', icon: Activity, color: 'text-emerald-500' },
                     { id: 'Geotécnica', icon: Shield, color: 'text-amber-500' },
                     { id: 'Rio / Hidro', icon: Waves, color: 'text-blue-500' },
                     { id: 'Chuva', icon: CloudRain, color: 'text-sky-500' },
                     { id: 'Meteo', icon: Thermometer, color: 'text-orange-500' },
                     { id: 'Vento', icon: Wind, color: 'text-slate-400' },
                     { id: 'Sensor', icon: Activity, color: 'text-zinc-400' },
                     { id: 'Pontos Críticos', icon: AlertTriangle, color: 'text-red-500' }
                   ].map((layer) => (
                     <button
                       key={layer.id}
                       type="button"
                       aria-pressed={activeLayers.includes(layer.id)}
                       onClick={() => setActiveLayers(prev => 
                         prev.includes(layer.id) ? prev.filter(l => l !== layer.id) : [...prev, layer.id]
                       )}
                       className={cn(
                         "flex items-center gap-3 px-3 py-2.5 rounded-xl text-2xs font-bold uppercase tracking-widest transition-all group",
                         activeLayers.includes(layer.id) 
                          ? "bg-white/10 text-white shadow-inner" 
                          : "text-zinc-400 hover:text-zinc-300 hover:bg-white/5"
                       )}
                     >
                       <layer.icon className={cn("h-3.5 w-3.5", activeLayers.includes(layer.id) ? layer.color : "opacity-30")} />
                       <span className="truncate">{layer.id}</span>
                       {activeLayers.includes(layer.id) && <div className="ml-auto h-1 w-1 rounded-full bg-primary shadow-[0_0_5px_rgba(99,102,241,0.5)]" />}
                     </button>
                   ))}
              </div>
            </MapToolPopover>
            <TerrainControl enabled={showTerrain} onChange={setShowTerrain} status={terrainStatus} {...toolProps('terrain')} />
            <RiskLegend {...toolProps('legend')} />
          </div>

          {filteredSensorsForMap.map((sensor: SensorResponseDTO) => {
            const config = getSensorConfig(sensor);
            const freshness = getDataFreshness(sensor.timestamp);
            const isStale = freshness.status === 'stale';
            const isSelected = selectedSensorId === sensor.id;
            const isNearby = nearbySensorIds.has(sensor.sensorId);

            return (
              <MapMarker 
                key={sensor.id} 
                longitude={sensor.longitude!} 
                latitude={sensor.latitude!}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSensorClick(sensor);
                  if (sensor.latitude && sensor.longitude) {
                    mapRef.current?.flyTo({
                      center: [sensor.longitude, sensor.latitude],
                      zoom: 13.5,
                      duration: 1500
                    });
                  }
                }}
                offset={[0, -20]}
                label={`Sensor ${sensor.stationName || sensor.sensorId}, ${config.label}${isStale ? ', sem resposta recente' : ''}. Pressione Enter para abrir.`}
              >
                <MarkerContent>
                  <div className="relative group cursor-pointer flex flex-col items-center">
                    <div className={cn(
                      "h-10 w-10 rounded-2xl rounded-bl-none rotate-45 border-2 border-zinc-950 shadow-[0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 z-10 relative overflow-hidden",
                      config.color,
                      isStale && "opacity-50 grayscale",
                      isSelected ? 'ring-2 ring-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : '',
                      isNearby && !isSelected ? 'ring-2 ring-primary/60 scale-105' : ''
                    )}>
                      <div className="-rotate-45 flex items-center justify-center h-full w-full">
                         {React.createElement(config.icon, { className: "h-5 w-5 text-white" })}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                    </div>

                    {isStale && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-zinc-950 z-20" title="Sensor sem resposta recente" aria-hidden="true" />
                    )}

                    {isSelected && (
                      <div className="absolute -bottom-1 w-2 h-2 bg-white rounded-full blur-[2px] animate-pulse" />
                    )}

                    {isNearby && !isSelected && (
                      <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary/60 rounded-full blur-[1px]" />
                    )}

                    {(isSelected || isNearby) && (
                      <div className={cn(
                        "absolute inset-0 rounded-2xl rotate-45 animate-ping opacity-20 pointer-events-none",
                        isSelected ? "bg-white" : "bg-primary"
                      )} />
                    )}
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          })}

          {filteredFloodPointsForMap.map((point: FloodPointResponseDTO) => {
            const isSelected = selectedFloodPointId === point.id;
            
            // Risk level color mapping
            const riskLevel = (isSelected && floodPointStatus?.floodPrediction?.riskLevel) || point.floodPrediction?.riskLevel;
            const { label: riskLabel } = getRiskVisual(riskLevel);

            return (
              <MapMarker 
                key={point.id} 
                longitude={point.longitude} 
                latitude={point.latitude}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFloodPointClick(point);
                  if (point.latitude && point.longitude) {
                    mapRef.current?.flyTo({
                      center: [point.longitude, point.latitude],
                      zoom: 13.5,
                      duration: 1500
                    });
                  }
                }}
                offset={[0, -20]}
                label={`Ponto crítico ${point.name}: risco ${riskLabel}. Pressione Enter para abrir.`}
              >
                <MarkerContent>
                  {/* Alvo de toque >= 44 px (marcador 32 px + 6 px de cada lado). */}
                  <div className="group relative flex cursor-pointer flex-col items-center p-1.5">
                    <RiskBadge
                      level={riskLevel}
                      variant="marker"
                      pulse={riskLevel === 'HIGH'}
                      className={cn('transition-transform duration-200 group-hover:scale-110', isSelected && 'scale-125 rounded-lg ring-2 ring-ring ring-offset-2 ring-offset-background')}
                    />
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          })}

            {selectedSensor && selectedSensor.latitude != null && selectedSensor.longitude != null && (
              <MapPopup
                longitude={selectedSensor.longitude}
                latitude={selectedSensor.latitude}
                onClose={() => setSelectedSensorId(undefined)}
                className="p-0 border-none shadow-none bg-transparent max-w-none"
                offset={[0, -45]}
                anchor="bottom"
                autoPan
                label={`Detalhes do sensor ${selectedSensor.stationName || selectedSensor.sensorId}`}
              >
                <SensorPopup 
                  sensor={selectedSensor} 
                  status={sensorStatus}
                  isFetchingStatus={isFetchingStatus}
                  onShowDetails={() => setShowDetailCard(true)} 
                />
              </MapPopup>
            )}

            {selectedFloodPoint && (
              <MapPopup
                longitude={selectedFloodPoint.longitude}
                latitude={selectedFloodPoint.latitude}
                onClose={() => setSelectedFloodPointId(undefined)}
                className="p-0 border-none shadow-none bg-transparent max-w-none"
                offset={[0, -45]}
                anchor="bottom"
                autoPan
                label={`Detalhes do ponto crítico ${selectedFloodPoint.name}`}
              >
                <FloodPointPopup 
                  point={selectedFloodPoint}
                  onShowDetails={() => setShowDetailCard(true)}
                  status={floodPointStatus}
                  isFetchingStatus={isFetchingStatus}
                />
              </MapPopup>
            )}

            {clickedLocation && (
              <MapMarker 
                longitude={clickedLocation.lng} 
                latitude={clickedLocation.lat}
                offset={[0, -12]}
              >
                <MarkerContent>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping opacity-30" />
                    <div className="h-6 w-6 rounded-full border-2 border-zinc-950 bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center relative z-10">
                      <MapPin className="h-3 w-3 text-white" />
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
                const fullSensor = sensors.find(s => s.sensorId === reading.sensorId);
                if (fullSensor) {
                  handleSensorClick(fullSensor);
                  if (fullSensor.latitude && fullSensor.longitude) {
                    mapRef.current?.flyTo({ center: [fullSensor.longitude, fullSensor.latitude], zoom: 16 });
                  }
                }
              }}
              onReport={() => {
                if (clickedLocation) {
                  setScenarioCoords({ lat: clickedLocation.lat, lng: clickedLocation.lng });
                  setScenarioTitle('A região correspondente à coordenada clicada se encontra alagada agora?');
                  setShowScenarioModal(true);
                }
              }}
            />
          )}

          {showDetailCard && selectedSensor && (
            <SensorDetailCard 
              sensor={selectedSensor} 
              status={sensorStatus}
              onClose={() => setShowDetailCard(false)} 
            />
          )}

          {showDetailCard && selectedFloodPoint && (
            <FloodPointDetailCard 
              point={selectedFloodPoint}
              status={floodPointStatus}
              isFetchingStatus={isFetchingStatus}
              onClose={() => setShowDetailCard(false)}
              onReportFlood={() => setShowReportModal(true)}
              onExportCsv={() => handleExportCsv(selectedFloodPoint)}
              onFocusMap={() => {
                setShowDetailCard(false);
                mapRef.current?.flyTo({
                  center: [selectedFloodPoint.longitude, selectedFloodPoint.latitude],
                  zoom: 16
                });
              }}
            />
          )}

          {isLoading && (
            <div role="status" aria-live="polite" className="absolute inset-0 bg-slate-950 flex items-center justify-center z-50">
              <div className="flex flex-col items-center p-8 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl">
                <div className="relative h-16 w-16 mb-6 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                   <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                   <Activity className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase animate-pulse">Carregando Sistema</h2>
                <p className="text-2xs text-zinc-400 mt-2 uppercase font-medium tracking-tighter">MAPI • Monitoramento Ambiental</p>
              </div>
            </div>
          )}

          {showReportModal && selectedFloodPoint && (
            <ReportFloodModal 
              point={selectedFloodPoint}
              severity={reportSeverity}
              description={reportDescription}
              isSubmitting={isSubmittingReport}
              onSeverityChange={setReportSeverity}
              onDescriptionChange={setReportDescription}
              onConfirm={handleReportFlood}
              onClose={() => setShowReportModal(false)}
            />
          )}

          {showScenarioModal && scenarioCoords && (
            <ReportScenarioModal
              latitude={scenarioCoords.lat}
              longitude={scenarioCoords.lng}
              isSubmitting={isSubmittingScenario}
              title={scenarioTitle}
              onConfirm={handleConfirmScenario}
              onClose={() => setShowScenarioModal(false)}
            />
          )}

          {/* Botão Flutuante de Geolocalização */}
          {/* No celular o card de análise de local ocupa a base da tela e já tem "Reportar alagamento aqui": o botão some. */}
          <div className={cn("absolute bottom-6 right-16 sm:right-20 z-40 pointer-events-auto", (clickedLocation || isFetchingLocation) && "hidden lg:block")}>
            <Button
              onClick={handleGetGeolocation}
              disabled={isGettingLocation}
              className={cn(
                "h-12 px-3 sm:px-5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 hover:bg-white/15 hover:border-primary/50 text-white transition-all flex items-center gap-2 group",
                isGettingLocation ? "text-primary border-primary/40 animate-pulse" : ""
              )}
              title="Obter minha localização atual e reportar se a área está alagada"
              aria-label={isGettingLocation ? 'Obtendo localização' : 'Reportar alagamento no local onde estou'}
            >
              {isGettingLocation ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  <span className="hidden sm:inline text-sm font-semibold text-primary">Obtendo Localização...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                  <span className="hidden sm:inline text-sm font-semibold text-white/90 group-hover:text-white">Reportar Alagamento Local</span>
                </>
              )}
            </Button>
          </div>
        </main>
      <NoticeRegion notices={notices} onDismiss={dismiss} />
    </div>
  );
};

export default MapView;
