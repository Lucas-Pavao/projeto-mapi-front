import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MapPopup, MapCircle, useMap } from '@/components/ui/map';
import type { MapRef } from '@/components/ui/map';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  User, 
  Layers, 
  Settings, 
  Shield, 
  Activity,
  AlertTriangle,
  Waves,
  Droplets,
  Navigation,
  CloudRain,
  BatteryCharging,
  Thermometer,
  Wind,
  MapPin,
  X,
  Sun,
  Gauge,
  RefreshCw
} from 'lucide-react';

import { exportService } from '../services/export.service';
import { floodService } from '../services/flood.service';
import { mapService } from '../services/map.service';
import { getSensorConfig, getBatteryStatus, formatApiTimestamp } from '../utils/sensor';
import { SensorSidebar } from './SensorSidebar';
import { SensorPopup } from './SensorPopup';
import { FloodPointPopup } from './FloodPointPopup';
import { SensorDetailCard } from './SensorDetailCard';
import { FloodPointDetailCard } from './FloodPointDetailCard';
import { ReportFloodModal } from './ReportFloodModal';
import { ReportScenarioModal } from './ReportScenarioModal';
import { useMapData } from '../hooks/useMapData';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO, FloodPointResponseDTO, PreciseDataResponse } from '../types';

/**
 * Component to request user geolocation when the map is loaded and fly to it.
 */
const LocationInitializer: React.FC = () => {
  const { map, isLoaded } = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isLoaded && map && !hasInitialized.current) {
      hasInitialized.current = true;
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              duration: 2000
            });
          },
          (error) => {
            console.warn("Could not retrieve user location on initial load:", error.message || "Unknown error");
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }
    }
  }, [isLoaded, map]);

  return null;
};

/**
 * Main View for the Map Monitoring System
 */
export const MapView: React.FC = () => {
  const { user, logout } = useAuth();
  const { sensors, floodPoints, isLoading } = useMapData();
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
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSeverity, setReportSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioCoords, setScenarioCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [isSubmittingScenario, setIsSubmittingScenario] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const mapRef = useRef<MapRef>(null);

  // Fetch real-time status when a flood point is selected
  useEffect(() => {
    if (selectedFloodPoint?.id_ponto) {
      let isMounted = true;
      const fetchStatus = async () => {
        setIsFetchingStatus(true);
        try {
          // Fetch BOTH point status (for sensor config) and rich analysis (for fallbacks)
          const [pointData, preciseAnalysis] = await Promise.all([
            floodService.getPointStatus(selectedFloodPoint.id_ponto),
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
            const sensorIds = pointData.sensores_proximos_ids || [];
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
  }, [selectedFloodPoint?.id_ponto, selectedFloodPoint?.latitude, selectedFloodPoint?.longitude, setIsFetchingStatus, setFloodPointStatus]);

  const handleExportCsv = async (point: FloodPointResponseDTO) => {
    try {
      const csvData = await exportService.getUnifiedIADataCsv(point.id_ponto);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `dataset_${point.id_ponto}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar dados para CSV.');
    }
  };

  const handleReportFlood = async () => {
    if (!selectedFloodPoint) return;

    setIsSubmittingReport(true);
    try {
      await floodService.reportFlood({
        floodPointSlug: selectedFloodPoint.id_ponto,
        severity: reportSeverity,
        description: reportDescription,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(), // 1h default
        confirmedBy: user?.username || 'Operador'
      });
      alert('Evento de alagamento registrado com sucesso!');
      setShowReportModal(false);
      setReportDescription('');
    } catch (error) {
      console.error('Erro ao reportar alagamento:', error);
      alert('Erro ao registrar evento.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleGetGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada ou disponível neste navegador (verifique se está acessando via HTTPS ou localhost).');
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
        alert(msg);
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
      alert('Situação da região reportada com sucesso!');
      setShowScenarioModal(false);
      setScenarioCoords(null);
    } catch (error) {
      console.error('Erro ao reportar cenário:', error);
      alert('Erro ao enviar o relato do cenário.');
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
    if (clickedLocation) return "#6366f1"; // Primary color for clicked location
    
    if (selectedFloodPoint) {
      // Prioritize the real-time status prediction, fallback to point prediction
      const riskLevel = floodPointStatus?.floodPrediction?.riskLevel || selectedFloodPoint.floodPrediction?.riskLevel;
      if (riskLevel === 'CRITICAL') return '#ef4444'; // red-500
      if (riskLevel === 'HIGH') return '#f97316';     // orange-500
      if (riskLevel === 'MEDIUM') return '#f59e0b';   // amber-500
      if (riskLevel === 'LOW') return '#10b981';      // emerald-500
      return '#ef4444'; // Default red for flood points
    }
    
    return "#6366f1";
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
    if (selectedFloodPoint?.sensores_proximos_ids) {
      selectedFloodPoint.sensores_proximos_ids.forEach(id => ids.add(id));
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
        <div className="h-16 border border-white/10 bg-black/40 backdrop-blur-xl flex items-center px-6 rounded-2xl shadow-2xl shadow-black/50 transition-all duration-500 hover:bg-black/60">
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-white uppercase tracking-[0.3em]">MAPI Portal</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sistemas Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Controls Floating Island */}
      <div className="absolute top-4 right-4 z-40 pointer-events-auto">
        <div className="h-16 border border-white/10 bg-black/40 backdrop-blur-xl flex items-center gap-3 px-4 rounded-2xl shadow-2xl shadow-black/50 hover:bg-black/60 transition-all">
           <div className="flex flex-col items-end mr-1 hidden sm:flex">
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">{user?.username || 'Convidado'}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Admin</span>
           </div>
           <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-primary transition-colors cursor-pointer group">
              <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
           </div>
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={logout}
             className="h-10 w-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-zinc-500 transition-all border border-transparent hover:border-red-500/20"
           >
             <LogOut className="h-5 w-5" />
           </Button>
        </div>
      </div>

      {/* Floating Sidebar Overlay */}
      <div className="absolute top-24 left-4 bottom-4 z-20 pointer-events-none hidden md:flex">
        <div className="pointer-events-auto h-full shadow-2xl shadow-black/60 rounded-2xl overflow-hidden border border-white/10 ring-1 ring-white/5">
          <SensorSidebar 
            sensors={sensors} 
            floodPoints={floodPoints}
            onSensorClick={(sensor) => {
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
          />
        </div>
      </div>
      
      <main className="h-full w-full relative">
        <Map
          ref={mapRef}
          theme="dark"
          onClick={handleMapClick}
          center={[-34.877, -8.057]}
          zoom={12}
        >
          <LocationInitializer />
          <MapControls showLocate showFullscreen position="bottom-right" />
          
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
          <div className="absolute top-24 right-4 z-20 flex flex-col gap-3">
            <div className="relative">
              <Button 
                variant="secondary" 
                size="icon" 
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className={cn(
                  "h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 hover:bg-white/10 transition-all",
                  showLayerPanel ? "text-primary border-primary/40 bg-white/10" : "text-zinc-400"
                )}
              >
                 <Layers className="h-5 w-5" />
              </Button>

              {showLayerPanel && (
                <div className="absolute right-14 top-0 bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl shadow-black/60 flex flex-col gap-1 w-48 animate-in slide-in-from-right-2 duration-200 overflow-y-auto max-h-[60vh]">
                   <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                         <Layers className="h-3 w-3" /> Camadas
                      </p>
                   </div>
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
                       onClick={() => setActiveLayers(prev => 
                         prev.includes(layer.id) ? prev.filter(l => l !== layer.id) : [...prev, layer.id]
                       )}
                       className={cn(
                         "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all group",
                         activeLayers.includes(layer.id) 
                          ? "bg-white/10 text-white shadow-inner" 
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                       )}
                     >
                       <layer.icon className={cn("h-3.5 w-3.5", activeLayers.includes(layer.id) ? layer.color : "opacity-30")} />
                       <span className="truncate">{layer.id}</span>
                       {activeLayers.includes(layer.id) && <div className="ml-auto h-1 w-1 rounded-full bg-primary shadow-[0_0_5px_rgba(99,102,241,0.5)]" />}
                     </button>
                   ))}
                </div>
              )}
            </div>

            <Button variant="secondary" size="icon" className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 hover:bg-white/10 text-zinc-400">
               <Settings className="h-5 w-5" />
            </Button>
          </div>

          {filteredSensorsForMap.map((sensor: SensorResponseDTO) => {
            const config = getSensorConfig(sensor);
            const { isCharging } = getBatteryStatus(sensor.batteryStatus);
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
                      zoom: 15,
                      duration: 1500
                    });
                  }
                }}
                offset={[0, -20]}
              >
                <MarkerContent>
                  <div className="relative group cursor-pointer flex flex-col items-center">
                    <div className={cn(
                      "h-10 w-10 rounded-2xl rounded-bl-none rotate-45 border-2 border-zinc-950 shadow-[0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 z-10 relative overflow-hidden",
                      isCharging ? "bg-emerald-600" : config.color,
                      isSelected ? 'ring-2 ring-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : '',
                      isNearby && !isSelected ? 'ring-2 ring-primary/60 scale-105' : ''
                    )}>
                      <div className="-rotate-45 flex items-center justify-center h-full w-full">
                         {isCharging ? <BatteryCharging className="h-5 w-5 text-white" /> : React.createElement(config.icon, { className: "h-5 w-5 text-white" })}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                    </div>

                    {isSelected && (
                      <div className="absolute -bottom-1 w-2 h-2 bg-white rounded-full blur-[2px] animate-pulse" />
                    )}

                    {isNearby && !isSelected && (
                      <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary/60 rounded-full blur-[1px]" />
                    )}

                    {(isCharging || isSelected || isNearby) && (
                      <div className={cn(
                        "absolute inset-0 rounded-2xl rotate-45 animate-ping opacity-20 pointer-events-none",
                        isCharging ? "bg-emerald-400" : (isSelected ? "bg-white" : "bg-primary")
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
            const colorClass = 
              riskLevel === 'CRITICAL' ? 'bg-red-600' :
              riskLevel === 'HIGH' ? 'bg-orange-500' :
              riskLevel === 'MEDIUM' ? 'bg-amber-500' :
              riskLevel === 'LOW' ? 'bg-emerald-500' : 
              'bg-red-600';
            
            const pingColorClass = 
              riskLevel === 'CRITICAL' ? 'bg-red-400' :
              riskLevel === 'HIGH' ? 'bg-orange-400' :
              riskLevel === 'MEDIUM' ? 'bg-amber-400' :
              riskLevel === 'LOW' ? 'bg-emerald-400' : 
              'bg-red-400';

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
                      zoom: 15,
                      duration: 1500
                    });
                  }
                }}
                offset={[0, -20]}
              >
                <MarkerContent>
                  <div className="relative group cursor-pointer flex flex-col items-center">
                    <div className={cn(
                      "h-10 w-10 rounded-2xl rounded-bl-none rotate-45 border-2 border-zinc-950 shadow-[0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 z-10 relative overflow-hidden",
                      colorClass,
                      isSelected ? 'ring-2 ring-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''
                    )}>
                      <div className="-rotate-45 flex items-center justify-center h-full w-full">
                         <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                    </div>

                    {isSelected && (
                      <div className="absolute -bottom-1 w-2 h-2 bg-white rounded-full blur-[2px] animate-pulse" />
                    )}

                    <div className={cn("absolute inset-0 rounded-2xl rotate-45 animate-ping opacity-20 pointer-events-none", pingColorClass)} />
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
            <div className="absolute bottom-10 left-[416px] z-30 w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5">
                <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                      <Navigation className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white tracking-tight uppercase">Análise de Local</h3>
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">
                        {clickedLocation ? `${clickedLocation.lat?.toFixed(4) ?? '--'}, ${clickedLocation.lng?.toFixed(4) ?? '--'}` : 'Sincronizando...'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors" 
                    onClick={() => closePopups()}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-5 space-y-5">
                  {isFetchingLocation ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-4">
                       <div className="relative">
                          <div className="h-12 w-12 border-2 border-primary/20 rounded-full" />
                          <div className="absolute inset-0 h-12 w-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                       </div>
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] animate-pulse">Consultando Dados Geoespaciais...</span>
                    </div>
                  ) : locationInfo ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-500">
                      {/* Detailed Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                         {locationInfo.preciseData?.temperature != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Temperatura</span>
                               </div>
                               <span className="text-lg font-black text-white italic">
                                 {locationInfo.preciseData.temperature.toFixed(1)}
                                 <small className="text-[10px] ml-1 opacity-50 not-italic">{locationInfo.preciseData.unitTemperature || '°C'}</small>
                               </span>
                            </div>
                         )}
                         {locationInfo.preciseData?.humidity != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Droplets className="h-3.5 w-3.5 text-blue-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Umidade</span>
                               </div>
                               <span className="text-lg font-black text-white italic">{locationInfo.preciseData.humidity.toFixed(0)}%</span>
                            </div>
                         )}
                         {locationInfo.preciseData?.precipitation != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <CloudRain className="h-3.5 w-3.5 text-sky-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Chuva</span>
                               </div>
                               <span className="text-lg font-black text-white italic">
                                 {locationInfo.preciseData.precipitation.toFixed(1)}
                                 <small className="text-[10px] ml-1 opacity-50 not-italic">{locationInfo.preciseData.unitPrecipitation || 'mm'}</small>
                               </span>
                            </div>
                         )}
                         {locationInfo.preciseData?.windSpeed != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Wind className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Vento</span>
                               </div>
                               <span className="text-lg font-black text-white italic">
                                 {locationInfo.preciseData.windSpeed.toFixed(1)}
                                 <small className="text-[10px] ml-1 opacity-50 not-italic">{locationInfo.preciseData.unitWindSpeed || 'km/h'}</small>
                               </span>
                            </div>
                         )}
                         {locationInfo.preciseData?.pressure != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Pressão</span>
                               </div>
                               <span className="text-lg font-black text-white italic">
                                 {locationInfo.preciseData.pressure.toFixed(0)}
                                 <small className="text-[10px] ml-1 opacity-50 not-italic">{locationInfo.preciseData.unitPressure || 'hPa'}</small>
                               </span>
                            </div>
                         )}
                         {locationInfo.preciseData?.solarRadiation != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Sun className="h-3.5 w-3.5 text-yellow-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Radiação</span>
                               </div>
                               <span className="text-lg font-black text-white italic">
                                 {locationInfo.preciseData.solarRadiation.toFixed(1)}
                                 <small className="text-[10px] ml-1 opacity-50 not-italic">{locationInfo.preciseData.unitSolarRadiation || 'W/m²'}</small>
                               </span>
                            </div>
                         )}
                         {locationInfo.preciseData?.waterLevel != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Waves className="h-3.5 w-3.5 text-blue-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Nível Água</span>
                               </div>
                               <span className="text-lg font-black text-white italic">
                                 {locationInfo.preciseData.waterLevel.toFixed(2)}
                                 <small className="text-[10px] ml-1 opacity-50 not-italic">{locationInfo.preciseData.unitWaterLevel || 'm'}</small>
                               </span>
                            </div>
                         )}
                         {locationInfo.preciseData?.flowRate != null && (
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <Gauge className="h-3.5 w-3.5 text-indigo-400" />
                                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-tighter">Vazão</span>
                               </div>
                               <span className="text-lg font-black text-white italic">
                                 {locationInfo.preciseData.flowRate.toFixed(2)}
                                 <small className="text-[10px] ml-1 opacity-50 not-italic">{locationInfo.preciseData.unitFlowRate || 'm³/s'}</small>
                               </span>
                            </div>
                         )}
                      </div>

                      {/* Dynamic Nearby Sensors List */}
                      {locationInfo.preciseData?.latestReadings && locationInfo.preciseData.latestReadings.length > 0 && (
                        <div className="space-y-3">
                           <div className="flex items-center justify-between px-1">
                             <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Sensores no Raio (3km)</p>
                             <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                               {locationInfo.preciseData.latestReadings.length} ativos
                             </span>
                           </div>
                           <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                             {locationInfo.preciseData.latestReadings.map((reading) => (
                               <div 
                                  key={`${reading.sensorId}-${reading.type}`}
                                  className="bg-black/40 p-3 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all hover:bg-white/5"
                                  onClick={() => {
                                    const fullSensor = sensors.find(s => s.sensorId === reading.sensorId);
                                    if (fullSensor) {
                                      handleSensorClick(fullSensor);
                                      if (fullSensor.latitude && fullSensor.longitude) {
                                        mapRef.current?.flyTo({
                                          center: [fullSensor.longitude, fullSensor.latitude],
                                          zoom: 16
                                        });
                                      }
                                    }
                                  }}
                               >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                                      <Activity className="h-4 w-4" />
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">
                                         {reading.sensorId}
                                       </p>
                                       <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">
                                          {reading.type} • {reading.distanceKm?.toFixed(1) ?? '--'}km
                                       </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-black text-white italic">
                                      {reading.value?.toFixed(1) ?? '--'}
                                      <small className="text-[9px] font-bold text-zinc-600 ml-1 not-italic">{reading.unit}</small>
                                    </p>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                      {/* Tide & Harbor Status */}
                      {(locationInfo.preciseData?.tideHeight != null || nearestHarbor) && (
                        <div className="bg-blue-600/10 p-5 rounded-3xl border border-blue-500/20 space-y-4">
                           <div className="flex justify-between items-start">
                              <div>
                                 <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">Previsão de Marés</p>
                                 <h4 className="text-xs font-black text-white uppercase">{nearestHarbor?.name as string || 'Porto da Região'}</h4>
                              </div>
                              <Waves className="h-6 w-6 text-blue-400 opacity-50" />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <p className="text-[8px] text-zinc-500 font-black uppercase">Estimado (Tábua)</p>
                                 <p className="text-xl font-black text-white italic">{locationInfo.preciseData?.tideHeightTabuaMare?.toFixed(2) ?? '--'}m</p>
                              </div>
                              <div className="space-y-1 text-right border-l border-white/10 pl-4">
                                 <p className="text-[8px] text-zinc-500 font-black uppercase">Monitorado</p>
                                 <p className="text-xl font-black text-blue-400 italic">{locationInfo.preciseData?.tideHeight?.toFixed(2) ?? '--'}m</p>
                              </div>
                           </div>
                        </div>
                      )}
                      
                      {/* Botão de Reportar Cenário para coordenada clicada */}
                      <div className="pt-3 border-t border-white/5">
                        <Button
                          className="w-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl transition-all flex items-center justify-center gap-2"
                          onClick={() => {
                            if (clickedLocation) {
                              setScenarioCoords({ lat: clickedLocation.lat, lng: clickedLocation.lng });
                              setScenarioTitle('A região correspondente à coordenada clicada se encontra alagada agora?');
                              setShowScenarioModal(true);
                            }
                          }}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Reportar Alagamento Aqui
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
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
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center z-50">
              <div className="flex flex-col items-center p-8 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl">
                <div className="relative h-16 w-16 mb-6 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                   <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                   <Activity className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase animate-pulse">Carregando Sistema</h2>
                <p className="text-[10px] text-zinc-500 mt-2 uppercase font-medium tracking-tighter">MAPI • Monitoramento Ambiental</p>
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
          <div className="absolute bottom-6 right-20 z-40 pointer-events-auto">
            <Button
              onClick={handleGetGeolocation}
              disabled={isGettingLocation}
              className={cn(
                "h-12 px-5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 hover:bg-white/15 hover:border-primary/50 text-white transition-all flex items-center gap-2 group",
                isGettingLocation ? "text-primary border-primary/40 animate-pulse" : ""
              )}
              title="Obter minha localização atual e reportar se a área está alagada"
            >
              {isGettingLocation ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-semibold text-primary">Obtendo Localização...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-white/90 group-hover:text-white">Reportar Alagamento Local</span>
                </>
              )}
            </Button>
          </div>
        </main>
    </div>
  );
};

export default MapView;
