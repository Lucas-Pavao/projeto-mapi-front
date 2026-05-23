import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MapPopup } from '@/components/ui/map';
import type { MapRef } from '@/components/ui/map';
import type { MapMouseEvent } from 'maplibre-gl';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Thermometer, 
  Battery, 
  BatteryCharging,
  Activity, 
  Layers, 
  User, 
  MapPin,
  CloudRain,
  Droplets,
  Navigation,
  Wind,
  Sun,
  Gauge,
  Zap,
  Clock,
  Info,
  Waves,
  X as CloseIcon,
  AlertTriangle
} from 'lucide-react';
import { mapService } from '../services/map.service';
import type { SensorResponseDTO, PreciseDataResponse, FloodPointResponseDTO } from '../types';
import { getSensorConfig, getBatteryStatus } from '../utils/sensor';
import { getWeatherCondition } from '../utils/weather';
import { SensorSidebar } from './SensorSidebar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Reusable component for the sensor information popup content
 */
const SensorPopupContent = ({ 
  sensor, 
  onShowDetails 
}: { 
  sensor: SensorResponseDTO; 
  onShowDetails: () => void;
}) => {
  const { isCharging, isLow, percentage } = getBatteryStatus(sensor.batteryStatus);
  const config = getSensorConfig(sensor);

  return (
    <div className="bg-zinc-900 text-white rounded-lg border border-zinc-800 shadow-2xl overflow-hidden w-72">
      <div className={cn(
        "p-4 text-white font-bold flex flex-col gap-1 relative",
        isCharging ? "bg-emerald-600" : config.color
      )}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] opacity-80 uppercase tracking-widest">{config.label}</span>
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        </div>
        <h3 className="text-sm leading-tight font-bold">{sensor.stationName || 'Estação sem nome'}</h3>
        <p className="text-[10px] opacity-70 font-medium truncate">{sensor.municipality || 'Localidade não informada'}</p>
      </div>
      
      <div className="p-4 space-y-4 bg-zinc-900/95">
        <div className="flex items-center justify-between">
          <div>
             <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Leitura Principal</p>
             <p className="text-2xl font-black text-white">
              {sensor.value !== null ? sensor.value : '--'} <small className="text-xs font-normal text-zinc-500">{sensor.unit || ''}</small>
             </p>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center bg-zinc-800/50 border border-zinc-700 shadow-inner",
            isCharging ? "text-emerald-400" : config.text
          )}>
            {isCharging ? <BatteryCharging className="h-5 w-5" /> : React.createElement(config.icon, { className: "h-5 w-5" })}
          </div>
        </div>

        {/* Quick stats if available */}
        {(sensor.temperature !== null || sensor.humidity !== null) && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {sensor.temperature !== null && (
              <div className="bg-zinc-800/50 p-2 rounded border border-zinc-700/50 flex items-center gap-2">
                <Thermometer className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] font-bold">{sensor.temperature}°C</span>
              </div>
            )}
            {sensor.humidity !== null && (
              <div className="bg-zinc-800/50 p-2 rounded border border-zinc-700/50 flex items-center gap-2">
                <Droplets className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] font-bold">{sensor.humidity}%</span>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Bateria</span>
            <div className="flex items-center gap-1.5">
              {isCharging ? (
                <BatteryCharging className="h-3 w-3 text-emerald-500" />
              ) : (
                <Battery className={cn(
                  "h-3 w-3",
                  isLow ? 'text-red-500' : 'text-emerald-500'
                )} />
              )}
              <span className="text-[10px] font-bold text-white uppercase">
                {percentage !== null ? `${percentage}%` : (sensor.batteryStatus || 'N/A')}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Fonte</span>
            <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">{sensor.source || 'OUTROS'}</span>
          </div>
        </div>

        <Button 
          onClick={onShowDetails}
          className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
        >
          Ver detalhes completos
        </Button>
      </div>
    </div>
  );
};

/**
 * Reusable component for the flood point information popup content
 */
const FloodPointPopupContent = ({ 
  point, 
  onShowDetails 
}: { 
  point: FloodPointResponseDTO; 
  onShowDetails: () => void;
}) => {
  return (
    <div className="bg-zinc-900 text-white rounded-lg border border-zinc-800 shadow-2xl overflow-hidden w-72">
      <div className="p-4 text-white font-bold flex flex-col gap-1 relative bg-red-600">
        <div className="flex justify-between items-center">
          <span className="text-[10px] opacity-80 uppercase tracking-widest">Ponto Crítico</span>
          <AlertTriangle className="h-4 w-4 animate-pulse" />
        </div>
        <h3 className="text-sm leading-tight font-bold">{point.nome}</h3>
        <p className="text-[10px] opacity-70 font-medium truncate">{point.municipio || 'Localidade não informada'}</p>
      </div>
      
      <div className="p-4 space-y-4 bg-zinc-900/95">
        <div className="flex items-center justify-between">
          <div>
             <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Nível da Maré</p>
             <p className="text-2xl font-black text-white">
              {point.tideHeight !== null ? point.tideHeight : '--'} <small className="text-xs font-normal text-zinc-500">{point.tideUnit || 'm'}</small>
             </p>
          </div>
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-zinc-800/50 border border-zinc-700 shadow-inner text-red-400">
            <Waves className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Altitude</span>
            <span className="text-[10px] font-bold text-white uppercase">{point.altitude_m !== null ? `${point.altitude_m}m` : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Dist. Canal</span>
            <span className="text-[10px] font-bold text-white uppercase">{point.dist_canal_m !== null ? `${point.dist_canal_m}m` : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Bacia</span>
            <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">{point.bacia_hidrografica || 'N/A'}</span>
          </div>
        </div>

        <Button 
          onClick={onShowDetails}
          className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
        >
          Ver Análise de Risco
        </Button>
      </div>
    </div>
  );
};

export const MapView: React.FC = () => {
  const { user, logout } = useAuth();
  const [sensors, setSensors] = useState<SensorResponseDTO[]>([]);
  const [floodPoints, setFloodPoints] = useState<FloodPointResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSensorId, setSelectedSensorId] = useState<number>();
  const [selectedFloodPointId, setSelectedFloodPointId] = useState<number>();
  const [showDetailCard, setShowDetailCard] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationInfo, setLocationInfo] = useState<PreciseDataResponse | null>(null);
  const [nearestHarbor, setNearestHarbor] = useState<any>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [activeLayers, setActiveLayers] = useState<string[]>(['Mista / Meteo', 'Geotécnica', 'Rio / Hidro', 'Chuva', 'Pontos Críticos']);
  const [sensorHistory, setSensorHistory] = useState<SensorResponseDTO[]>([]);
  const [floodPointStatus, setFloodPointStatus] = useState<PreciseDataResponse | null>(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);
  const mapRef = useRef<MapRef>(null);

  const selectedSensor = useMemo(() => 
    (sensors || []).find(s => s.id === selectedSensorId),
    [sensors, selectedSensorId]
  );

  const selectedFloodPoint = useMemo(() => 
    (floodPoints || []).find(p => p.id === selectedFloodPointId),
    [floodPoints, selectedFloodPointId]
  );

  useEffect(() => {
    if (showDetailCard && selectedFloodPoint?.id_ponto) {
      let isMounted = true;
      const fetchStatus = async () => {
        setIsFetchingStatus(true);
        try {
          const data = await mapService.getPointStatus(selectedFloodPoint.id_ponto);
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
  }, [showDetailCard, selectedFloodPoint?.id_ponto]);

  useEffect(() => {
    if (showDetailCard && selectedSensor?.sensorId) {
      let isMounted = true;
      const fetchHistory = async () => {
        setIsFetchingHistory(true);
        try {
          const data = await mapService.getSensorHistory(selectedSensor.sensorId);
          if (isMounted) setSensorHistory(data || []);
        } catch (error) {
          console.error('Erro ao buscar histórico:', error);
        } finally {
          if (isMounted) setIsFetchingHistory(false);
        }
      };
      fetchHistory();
      return () => { 
        isMounted = false; 
        setSensorHistory([]);
      };
    }
  }, [showDetailCard, selectedSensor?.sensorId]);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout to clear loading overlay
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    const fetchData = async () => {
      try {
        const [sensorsData, floodPointsData] = await Promise.all([
          mapService.getLatestSensors(),
          mapService.getAllFloodPoints()
        ]);
        
        if (isMounted) {
          setSensors(Array.isArray(sensorsData) ? sensorsData : []);
          setFloodPoints(Array.isArray(floodPointsData) ? floodPointsData : []);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, []);

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

  const handleMapClick = async (e: MapMouseEvent) => {
    if ((e.originalEvent?.target as HTMLElement)?.closest('.maplibregl-marker')) {
      return;
    }

    const { lng, lat } = e.lngLat;
    setClickedLocation({ lat, lng });
    setSelectedSensorId(undefined);
    setSelectedFloodPointId(undefined);
    setIsFetchingLocation(true);
    setLocationInfo(null);
    setNearestHarbor(null);
    try {
      const [data, harborData] = await Promise.all([
        mapService.getPreciseData(lat, lng),
        mapService.getNearestHarbor(lat, lng)
      ]);
      setLocationInfo(data);
      if (harborData && !harborData.error) {
        setNearestHarbor(harborData.data);
      }
    } catch (error) {
      console.error('Erro ao buscar informações do local:', error);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleCloseLocationInfo = () => {
    setClickedLocation(null);
    setLocationInfo(null);
    setNearestHarbor(null);
  };

  const handleSensorClick = (sensor: SensorResponseDTO, e?: React.MouseEvent | MouseEvent) => {
    if (e) e.stopPropagation();
    
    setClickedLocation(null);
    setSelectedFloodPointId(undefined);
    setSelectedSensorId(sensor.id);
    
    if (sensor.latitude != null && sensor.longitude != null && sensor.latitude !== 0 && sensor.longitude !== 0) {
      mapRef.current?.flyTo({
        center: [sensor.longitude, sensor.latitude],
        zoom: 15,
        duration: 2000
      });
    } else {
      // For sensors without coordinates, open the detail card directly
      setShowDetailCard(true);
    }
  };

  const handleFloodPointClick = (point: FloodPointResponseDTO, e?: React.MouseEvent | MouseEvent) => {
    if (e) e.stopPropagation();
    
    setClickedLocation(null);
    setSelectedSensorId(undefined);
    setSelectedFloodPointId(point.id);
    
    mapRef.current?.flyTo({
      center: [point.longitude, point.latitude],
      zoom: 15,
      duration: 2000
    });
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => 
      prev.includes(layer) 
        ? prev.filter(l => l !== layer) 
        : [...prev, layer]
    );
  };

  const [showLayersMenu, setShowLayersMenu] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 relative text-white">
      {/* Floating Header Overlay */}
      <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-zinc-900/95 border border-zinc-800 p-3 rounded-lg flex items-center gap-3 shadow-2xl">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none text-white">MAPI</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                Monitoramento
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-zinc-900/95 border border-zinc-800 px-4 py-2 rounded-lg flex items-center gap-3 shadow-2xl">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user?.username || 'Operador'}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Sessão Ativa</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            <button 
              onClick={logout}
              className="text-zinc-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex h-full w-full relative">
        {/* Sidebar Overlay */}
        <div className="absolute top-0 left-0 bottom-0 z-20 pt-24 pb-6 pl-6 pointer-events-none">
          <div className="pointer-events-auto h-full shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
            <SensorSidebar 
              sensors={sensors} 
              floodPoints={floodPoints}
              onSensorClick={handleSensorClick} 
              onFloodPointClick={handleFloodPointClick}
              selectedSensorId={selectedSensorId}
              selectedFloodPointId={selectedFloodPointId}
            />
          </div>
        </div>

        <main className="flex-1 relative h-full w-full bg-zinc-950">
          {/* Layers Toggle */}
          <div className="absolute top-24 right-6 z-20">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => setShowLayersMenu(!showLayersMenu)}
              className={cn(
                "shadow-2xl rounded-lg h-10 w-10 bg-zinc-900/95 border-zinc-800 hover:bg-zinc-800 transition-all",
                showLayersMenu ? "text-primary border-primary/50" : "text-zinc-400"
              )}
            >
              <Layers className="h-4 w-4" />
            </Button>

            {showLayersMenu && (
              <Card className="absolute right-full mr-2 top-0 w-56 shadow-2xl bg-zinc-900/95 border-zinc-800 z-50">
                <CardHeader className="p-3 border-b border-zinc-800">
                  <CardTitle className="text-[10px] uppercase tracking-widest font-bold opacity-70 text-white">Camadas</CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {['Mista / Meteo', 'Geotécnica', 'Rio / Hidro', 'Chuva', 'Pontos Críticos'].map((layer) => (
                    <button 
                      key={layer}
                      onClick={() => toggleLayer(layer)} 
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors text-xs font-medium text-white"
                    >
                      <span>{layer}</span>
                      <div className={cn(
                        "h-2 w-2 rounded-full", 
                        activeLayers.includes(layer) ? "bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-zinc-700"
                      )} />
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <Map 
            ref={mapRef}
            center={[-34.877, -8.057]}
            zoom={12}
            className="h-full w-full"
            theme="dark"
            onClick={handleMapClick}
          >
            <MapControls position="bottom-right" showZoom showLocate showFullscreen />
            
            {clickedLocation && (
              <MapMarker longitude={clickedLocation.lng} latitude={clickedLocation.lat}>
                <MarkerContent>
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-primary/20 animate-pulse" />
                    <div className="h-6 w-6 rounded-full border-2 border-white bg-primary shadow-lg flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            )}

            {filteredSensorsForMap.map((sensor) => {
              const config = getSensorConfig(sensor);
              const { isCharging } = getBatteryStatus(sensor.batteryStatus);

              return (
                <MapMarker 
                  key={sensor.id} 
                  longitude={sensor.longitude} 
                  latitude={sensor.latitude}
                  onClick={(e) => handleSensorClick(sensor, e)}
                >
                  <MarkerContent>
                    <div className="relative group cursor-pointer">
                      <div className={cn("absolute -inset-2 rounded-full animate-ping opacity-20", config.ping)} />
                      <div className={cn(
                        "h-8 w-8 rounded-full border-2 border-zinc-950 shadow-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 z-10 relative",
                        isCharging ? "bg-emerald-600" : config.color,
                        selectedSensorId === sensor.id ? 'ring-2 ring-white scale-110' : ''
                      )}>
                        {isCharging ? <BatteryCharging className="h-4 w-4" /> : React.createElement(config.icon, { className: "h-4 w-4" })}
                      </div>
                    </div>
                  </MarkerContent>
                </MapMarker>
              );
            })}

            {filteredFloodPointsForMap.map((point) => (
              <MapMarker 
                key={point.id} 
                longitude={point.longitude} 
                latitude={point.latitude}
                onClick={(e) => handleFloodPointClick(point, e)}
              >
                <MarkerContent>
                  <div className="relative group cursor-pointer">
                    <div className="absolute -inset-2 rounded-full animate-ping opacity-20 bg-red-500" />
                    <div className={cn(
                      "h-8 w-8 rounded-full border-2 border-zinc-950 shadow-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 z-10 relative bg-red-600",
                      selectedFloodPointId === point.id ? 'ring-2 ring-white scale-110' : ''
                    )}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            ))}

            {selectedSensor && selectedSensor.latitude != null && selectedSensor.longitude != null && (
              <MapPopup
                longitude={selectedSensor.longitude}
                latitude={selectedSensor.latitude}
                onClose={() => setSelectedSensorId(undefined)}
                className="p-0 border-none shadow-none"
              >
                <SensorPopupContent 
                  sensor={selectedSensor} 
                  onShowDetails={() => setShowDetailCard(true)} 
                />
              </MapPopup>
            )}

            {selectedFloodPoint && (
              <MapPopup
                longitude={selectedFloodPoint.longitude}
                latitude={selectedFloodPoint.latitude}
                onClose={() => setSelectedFloodPointId(undefined)}
                className="p-0 border-none shadow-none"
              >
                <FloodPointPopupContent 
                  point={selectedFloodPoint} 
                  onShowDetails={() => setShowDetailCard(true)} 
                />
              </MapPopup>
            )}
          </Map>

          {(clickedLocation || isFetchingLocation) && (
            <div className="absolute bottom-10 left-[360px] z-30 w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="shadow-2xl border-zinc-800 bg-zinc-900/95 backdrop-blur-md overflow-hidden ring-1 ring-white/10">
                <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-zinc-800 bg-zinc-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shadow-inner border border-primary/20">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white tracking-tight">Análise Local Otimizada</CardTitle>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                        {clickedLocation ? `${clickedLocation.lat.toFixed(6)}, ${clickedLocation.lng.toFixed(6)}` : 'Processando...'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" 
                    onClick={handleCloseLocationInfo}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 text-white">
                  {isFetchingLocation ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <div className="h-12 w-12 border-2 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 h-12 w-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Calculando Precisão</p>
                        <p className="text-[9px] text-zinc-600 uppercase mt-1">Sincronizando sensores e satélite...</p>
                      </div>
                    </div>
                  ) : locationInfo ? (
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      {/* Section 1: Source & Current Weather Summary */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Análise de Local</span>
                          <span className="text-[9px] text-zinc-400 font-medium italic mt-0.5">Fonte: {locationInfo.preciseData.source}</span>
                        </div>
                        {(() => {
                          const hasRain = (locationInfo.preciseData.precipitation || 0) > 2;
                          const highTide = (locationInfo.preciseData.tideHeight || 0) > 2.0;
                          const isWarning = hasRain || highTide;
                          const isCritical = hasRain && highTide;
                          
                          return (
                            <div className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 border rounded-full transition-all duration-500",
                              isCritical ? "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]" :
                              isWarning ? "bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]" :
                              "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            )}>
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse shadow-sm",
                                isCritical ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-emerald-500"
                              )} />
                              <span className="text-[9px] font-bold uppercase tracking-tighter">
                                {isCritical ? 'Risco Crítico' : isWarning ? 'Alerta de Risco' : 'Condição Estável'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Section 2: Primary Weather Grid */}
                      <div className="bg-zinc-800/40 rounded-2xl border border-zinc-700/30 overflow-hidden shadow-lg">
                        <div className="p-4 grid grid-cols-2 gap-4 border-b border-zinc-800/50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="p-1.5 bg-sky-500/10 rounded-lg">
                                <CloudRain className="h-4 w-4 text-sky-400" />
                              </div>
                              <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Chuva</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-white leading-none">
                                {locationInfo.preciseData.precipitation ?? '--'}
                              </span>
                              <span className="text-xs font-bold text-zinc-600 uppercase">{locationInfo.preciseData.unitPrecipitation || 'mm'}</span>
                            </div>
                          </div>
                          <div className="space-y-1 border-l border-zinc-800/50 pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="p-1.5 bg-orange-500/10 rounded-lg">
                                <Thermometer className="h-4 w-4 text-orange-400" />
                              </div>
                              <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Temperatura</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-white leading-none">
                                {locationInfo.preciseData.temperature ?? '--'}
                              </span>
                              <span className="text-xs font-bold text-zinc-600 uppercase">{locationInfo.preciseData.unitTemperature || '°C'}</span>
                            </div>
                          </div>
                        </div>

                        {/* OpenMeteo Condition Summary */}
                        {locationInfo.openMeteoData && (
                          <div className="px-4 py-2 bg-zinc-800/20 flex items-center justify-between">
                            {(() => {
                              const condition = getWeatherCondition(locationInfo.openMeteoData.current.weather_code);
                              return (
                                <div className="flex items-center gap-2">
                                  {React.createElement(condition.icon, { className: cn("h-3.5 w-3.5", condition.color) })}
                                  <span className={cn("text-[10px] font-bold uppercase tracking-wide", condition.color)}>
                                    {condition.label}
                                  </span>
                                </div>
                              );
                            })()}
                            {locationInfo.openMeteoData.current.apparent_temperature !== undefined && (
                              <span className="text-[9px] text-zinc-500 font-medium uppercase">
                                Sensação {locationInfo.openMeteoData.current.apparent_temperature}°C
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Section: Tide Comparison & Marine Data (Enhanced) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-1.5">
                            <Waves className="h-3 w-3 text-blue-400" /> Monitoramento Costeiro
                          </h4>
                          {nearestHarbor && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-bold border border-zinc-700 uppercase">
                              Porto: {nearestHarbor.name}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {/* Tide Comparison Card */}
                          <div className="bg-gradient-to-r from-blue-600/10 to-transparent p-4 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-[8px] text-blue-400 uppercase font-black tracking-widest">Nível da Maré</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">
                                  {locationInfo.preciseData.tideHeight ?? '--'}
                                </span>
                                <span className="text-xs font-bold text-blue-400/60 uppercase">{locationInfo.preciseData.unitTide || 'm'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="px-1.5 py-0.5 bg-zinc-800 rounded text-[7px] text-zinc-500 font-bold uppercase">Previsto: {locationInfo.preciseData.tideHeightTabuaMare ?? '--'} m</div>
                                {locationInfo.preciseData.tideHeight !== null && locationInfo.preciseData.tideHeightTabuaMare !== null && (
                                  <div className={cn(
                                    "text-[7px] font-bold uppercase",
                                    locationInfo.preciseData.tideHeight > locationInfo.preciseData.tideHeightTabuaMare ? "text-red-400" : "text-emerald-400"
                                  )}>
                                    {locationInfo.preciseData.tideHeight > locationInfo.preciseData.tideHeightTabuaMare ? '↑ Elevação' : '↓ Recuo'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                              <Waves className="h-6 w-6 text-blue-400" />
                            </div>
                          </div>

                          {/* Marine Grid (Waves) */}
                          {(locationInfo.preciseData.waveHeight !== null) && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-zinc-800/20 p-3 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center gap-1">
                                <Waves className="h-4 w-4 text-sky-400 opacity-60" />
                                <span className="text-xs font-black text-white mt-1">{locationInfo.preciseData.waveHeight} m</span>
                                <p className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Alt. Ondas</p>
                              </div>
                              <div className="bg-zinc-800/20 p-3 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center gap-1">
                                <Clock className="h-4 w-4 text-emerald-400 opacity-60" />
                                <span className="text-xs font-black text-white mt-1">{locationInfo.preciseData.wavePeriod ?? '--'} s</span>
                                <p className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Período</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section 3: Detailed Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2">
                         <div className="bg-zinc-800/20 p-2.5 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center gap-1 group hover:border-zinc-700/50 transition-colors">
                            <Droplets className="h-4 w-4 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="text-xs font-black text-white leading-none mt-1">{locationInfo.preciseData.humidity ?? '--'}%</span>
                            <p className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Umidade</p>
                         </div>

                         {locationInfo.preciseData.windSpeed !== null ? (
                           <div className="bg-zinc-800/20 p-2.5 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center gap-1 group hover:border-zinc-700/50 transition-colors">
                              <Wind className="h-4 w-4 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                              <span className="text-xs font-black text-white leading-none mt-1">{locationInfo.preciseData.windSpeed} <small className="text-[8px] font-bold">km/h</small></span>
                              <p className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Vento</p>
                           </div>
                         ) : (
                           <div className="bg-zinc-800/20 p-2.5 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center gap-1 group hover:border-zinc-700/50 transition-colors">
                              <Navigation className="h-4 w-4 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                              <span className="text-xs font-black text-white leading-none mt-1">{locationInfo.distanceToNearestSensorKm.toFixed(1)}km</span>
                              <p className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Prox. Estação</p>
                           </div>
                         )}

                         <div className="bg-zinc-800/20 p-2.5 rounded-xl border border-zinc-800/50 flex flex-col items-center justify-center text-center gap-1 group hover:border-zinc-700/50 transition-colors">
                            {locationInfo.preciseData.pressure ? (
                              <>
                                <Gauge className="h-4 w-4 text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs font-black text-white leading-none mt-1">{locationInfo.preciseData.pressure} <small className="text-[8px] font-bold">hPa</small></span>
                                <p className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Pressão</p>
                              </>
                            ) : (
                              <>
                                <Sun className="h-4 w-4 text-yellow-500/60 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs font-black text-white leading-none mt-1">
                                  {locationInfo.openMeteoData?.elevation ?? '--'}m
                                </span>
                                <p className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Elevação</p>
                              </>
                            )}
                         </div>
                      </div>

                      {/* Section 4: Hydrological Highlights (Conditional) */}
                      {(locationInfo.preciseData.waterLevel !== null || locationInfo.preciseData.flowRate !== null) && (
                        <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-2">
                          <p className="text-[8px] text-blue-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                            <Activity className="h-3 w-3" /> Níveis de Rio / Hidro
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                             {locationInfo.preciseData.waterLevel !== null && (
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Waves className="h-4 w-4 text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-[7px] text-zinc-500 uppercase font-bold">Nível d'água</p>
                                    <span className="text-sm font-black text-white">{locationInfo.preciseData.waterLevel} {locationInfo.preciseData.unitWaterLevel || 'm'}</span>
                                  </div>
                               </div>
                             )}
                             {locationInfo.preciseData.flowRate !== null && (
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-[7px] text-zinc-500 uppercase font-bold">Vazão Atual</p>
                                    <span className="text-sm font-black text-white">{locationInfo.preciseData.flowRate} m³/s</span>
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      )}

                      {/* Section 5: Optimization Message */}
                      {locationInfo.preciseData.message && (
                        <div className="px-3 py-2 bg-zinc-950/40 rounded-lg border border-zinc-800/80 flex items-start gap-2.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] text-zinc-500 font-medium leading-relaxed italic">
                            {locationInfo.preciseData.message}
                          </p>
                        </div>
                      )}

                      {/* Section 6: Nearest Station Reference */}
                      {locationInfo.nearestSensor && (
                        <div className="pt-2 border-t border-zinc-800/80">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" /> Estação de Referência
                            </h4>
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-bold uppercase border border-zinc-700">
                              {locationInfo.nearestSensor.source}
                            </span>
                          </div>

                          <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3 flex items-center justify-between group hover:bg-zinc-800/40 transition-all cursor-pointer"
                            onClick={(e) => handleSensorClick(locationInfo.nearestSensor, e)}>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-9 w-9 rounded-lg flex items-center justify-center text-white shadow-lg", 
                                getSensorConfig(locationInfo.nearestSensor).color
                              )}>
                                {React.createElement(getSensorConfig(locationInfo.nearestSensor).icon, { className: "h-5 w-5" })}
                              </div>
                              <div className="max-w-[160px]">
                                <p className="text-[11px] font-bold text-white truncate leading-tight">
                                  {locationInfo.nearestSensor.stationName}
                                </p>
                                <p className="text-[8px] text-zinc-500 font-medium truncate">
                                  {locationInfo.nearestSensor.municipality}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-white leading-none">
                                {locationInfo.nearestSensor.value} <span className="text-[9px] font-bold text-zinc-600">{locationInfo.nearestSensor.unit}</span>
                              </p>
                              <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                <Clock className="h-2.5 w-2.5 text-zinc-500" />
                                <span className="text-[8px] font-bold text-zinc-500">
                                  {new Date(locationInfo.nearestSensor.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}

          {showDetailCard && selectedSensor && (
            <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
              <Card className="w-full max-w-4xl max-h-[90vh] shadow-2xl border-zinc-800 bg-zinc-900 border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-white/10">
                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-zinc-800 bg-zinc-800/40 shrink-0">
                  <div className="flex items-center gap-4 text-white">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/10", 
                      getBatteryStatus(selectedSensor.batteryStatus).isCharging ? "bg-emerald-600" : getSensorConfig(selectedSensor).color
                    )}>
                      {getBatteryStatus(selectedSensor.batteryStatus).isCharging ? (
                        <BatteryCharging className="h-7 w-7" />
                      ) : (
                        React.createElement(getSensorConfig(selectedSensor).icon, { className: "h-7 w-7" })
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-black tracking-tight">
                          {selectedSensor.stationName || 'Estação sem nome'}
                        </CardTitle>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold uppercase border border-zinc-700">
                          {selectedSensor.source}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {selectedSensor.municipality || 'Localidade não informada'} • {selectedSensor.type || 'Tipo não informado'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" 
                    onClick={() => setShowDetailCard(false)}
                  >
                    <CloseIcon className="h-6 w-6" />
                  </Button>
                </CardHeader>

                <CardContent className="p-0 overflow-hidden flex flex-col">
                  <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Primary Highlight */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between group">
                        <div className="space-y-2">
                          <p className="text-xs text-zinc-500 uppercase font-black tracking-[0.2em]">Leitura Atual</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter">
                              {selectedSensor.value !== null ? selectedSensor.value : '--'}
                            </span>
                            <span className="text-xl font-bold text-zinc-600 uppercase">
                              {selectedSensor.unit || ''}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-medium flex items-center gap-2 pt-2">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            Sincronizado em {selectedSensor.timestamp ? new Date(selectedSensor.timestamp).toLocaleString('pt-BR') : 'Data não disponível'}
                          </p>
                        </div>
                        <div className={cn(
                          "h-24 w-24 rounded-3xl flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity",
                          getSensorConfig(selectedSensor).color
                        )}>
                          {React.createElement(getSensorConfig(selectedSensor).icon, { className: "h-16 w-16" })}
                        </div>
                      </div>

                      <div className="bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Bateria</p>
                            <div className={cn(
                              "px-2 py-1 rounded flex items-center gap-1.5 text-[10px] font-black uppercase",
                              getBatteryStatus(selectedSensor.batteryStatus).isLow ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                               {getBatteryStatus(selectedSensor.batteryStatus).isCharging ? <Zap className="h-3 w-3 animate-pulse" /> : <Battery className="h-3 w-3" />}
                               {getBatteryStatus(selectedSensor.batteryStatus).percentage !== null ? `${getBatteryStatus(selectedSensor.batteryStatus).percentage}%` : (selectedSensor.batteryStatus || 'N/A')}
                            </div>
                         </div>
                         <div className="pt-4">
                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                               <div 
                                 className={cn(
                                   "h-full rounded-full transition-all duration-1000",
                                   getBatteryStatus(selectedSensor.batteryStatus).isLow ? "bg-red-500" : "bg-emerald-500"
                                 )} 
                                 style={{ width: `${getBatteryStatus(selectedSensor.batteryStatus).percentage || 0}%` }}
                               />
                            </div>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase text-right">
                              Status: {getBatteryStatus(selectedSensor.batteryStatus).isCharging ? 'Carregando' : 'Operando'}
                            </p>
                         </div>
                      </div>
                    </div>

                    {/* Technical & Environmental Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Weather Metrics */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                          <Sun className="h-4 w-4 text-orange-400" /> Condições Meteorológicas
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Temperatura', value: selectedSensor.temperature, unit: '°C', icon: Thermometer, color: 'text-orange-400' },
                            { label: 'Umidade', value: selectedSensor.humidity, unit: '%', icon: Droplets, color: 'text-blue-400' },
                            { label: 'Pressão', value: selectedSensor.pressure, unit: 'hPa', icon: Gauge, color: 'text-emerald-400' },
                            { label: 'Vento', value: selectedSensor.windSpeed, unit: 'km/h', icon: Wind, color: 'text-slate-400' },
                            { label: 'Radiação Solar', value: selectedSensor.solarRadiation, unit: 'W/m²', icon: Sun, color: 'text-yellow-400' },
                            { label: 'Chuva Acumulada', value: selectedSensor.accumulatedPrecipitation, unit: 'mm', icon: CloudRain, color: 'text-sky-400' },
                          ].map((item, idx) => (
                            <div key={idx} className="bg-zinc-800/20 p-3 rounded-xl border border-zinc-800/50 flex items-center gap-3">
                              <div className={cn("h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0", item.color)}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">{item.label}</p>
                                <p className="text-sm font-bold text-white">
                                  {item.value !== null ? `${item.value} ${item.unit}` : '--'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hydrological & Info */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                            <Waves className="h-4 w-4 text-blue-400" /> Dados Hidrológicos
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-800/20 p-3 rounded-xl border border-zinc-800/50">
                              <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Nível da Água</p>
                              <p className="text-lg font-black text-white">{selectedSensor.waterLevel !== null ? `${selectedSensor.waterLevel} cm` : '--'}</p>
                            </div>
                            <div className="bg-zinc-800/20 p-3 rounded-xl border border-zinc-800/50">
                              <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Vazão</p>
                              <p className="text-lg font-black text-white">{selectedSensor.flowRate !== null ? `${selectedSensor.flowRate} m³/s` : '--'}</p>
                            </div>
                            <div className="col-span-2 bg-zinc-800/20 p-3 rounded-xl border border-zinc-800/50">
                              <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Bacia Hidrográfica</p>
                              <p className="text-sm font-bold text-white truncate">{selectedSensor.basinName || 'Não informada'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                            <Info className="h-4 w-4 text-zinc-400" /> Identificação Técnica
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
                               <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">ID do Sistema</p>
                               <p className="text-xs font-mono font-bold text-emerald-500 mt-1">{selectedSensor.sensorId}</p>
                            </div>
                            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between">
                               <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Código da Estação</p>
                               <p className="text-xs font-mono font-bold text-zinc-300 mt-1">{selectedSensor.code || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sensor History Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                        <Clock className="h-4 w-4 text-primary" /> Histórico de Leituras Recentes
                      </h4>
                      
                      {isFetchingHistory ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                          <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Carregando histórico...</p>
                        </div>
                      ) : sensorHistory.length > 0 ? (
                        <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-[10px]">
                            <thead>
                              <tr className="bg-zinc-800/40 text-zinc-500 uppercase font-black tracking-tighter">
                                <th className="px-4 py-2 border-b border-zinc-800">Horário</th>
                                <th className="px-4 py-2 border-b border-zinc-800">Valor</th>
                                <th className="px-4 py-2 border-b border-zinc-800">Bateria</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sensorHistory.slice(0, 10).map((history, idx) => (
                                <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                                  <td className="px-4 py-2 text-zinc-400 font-medium">
                                    {new Date(history.timestamp).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="px-4 py-2 font-black text-white">
                                    {history.value} <span className="text-zinc-600 font-bold">{history.unit}</span>
                                  </td>
                                  <td className="px-4 py-2">
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded-sm font-bold uppercase text-[8px]",
                                      getBatteryStatus(history.batteryStatus).isLow ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10"
                                    )}>
                                      {history.batteryStatus || 'N/A'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-zinc-800/20 rounded-xl border border-dashed border-zinc-800">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Nenhum histórico disponível para esta estação.</p>
                        </div>
                      )}
                    </div>

                    {/* Geolocation Section */}
                    <div className="bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                             <MapPin className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-white uppercase tracking-widest">Coordenadas Geográficas</p>
                             <p className="text-sm text-zinc-500 font-mono mt-1">
                               {selectedSensor.latitude !== null && selectedSensor.longitude !== null 
                                 ? `${selectedSensor.latitude.toFixed(6)}, ${selectedSensor.longitude.toFixed(6)}` 
                                 : 'Sem localização disponível'}
                             </p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          {selectedSensor.latitude !== null && selectedSensor.longitude !== null && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-xs font-bold uppercase tracking-widest h-10 px-6"
                              onClick={() => {
                                setShowDetailCard(false);
                                mapRef.current?.flyTo({
                                  center: [selectedSensor.longitude!, selectedSensor.latitude!],
                                  zoom: 16
                                });
                              }}
                            >
                              Focar no Mapa
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-xs font-bold uppercase tracking-widest h-10 px-6"
                            onClick={() => window.open(`https://www.google.com/maps?q=${selectedSensor.latitude},${selectedSensor.longitude}`, '_blank')}
                            disabled={selectedSensor.latitude === null}
                          >
                            Abrir no Maps
                          </Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {showDetailCard && selectedFloodPoint && (
            <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
              <Card className="w-full max-w-4xl max-h-[90vh] shadow-2xl border-zinc-800 bg-zinc-900 border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-white/10">
                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-zinc-800 bg-zinc-800/40 shrink-0">
                  <div className="flex items-center gap-4 text-white">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/10 bg-red-600">
                      <AlertTriangle className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-black tracking-tight">
                          {selectedFloodPoint.nome}
                        </CardTitle>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold uppercase border border-zinc-700">
                          Ponto de Risco
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {selectedFloodPoint.municipio || 'Localidade não informada'} • ID: {selectedFloodPoint.id_ponto}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors" 
                    onClick={() => setShowDetailCard(false)}
                  >
                    <CloseIcon className="h-6 w-6" />
                  </Button>
                </CardHeader>

                <CardContent className="p-0 overflow-hidden flex flex-col">
                  <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Primary Highlight */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-gradient-to-br from-red-900/20 to-zinc-900/50 p-6 rounded-2xl border border-red-900/30 shadow-xl flex items-center justify-between group relative overflow-hidden">
                        {isFetchingStatus && (
                          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Atualizando Dados Precisos...</span>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="text-xs text-zinc-500 uppercase font-black tracking-[0.2em]">Nível da Maré Atual</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-white tracking-tighter">
                              {floodPointStatus?.preciseData.tideHeight ?? selectedFloodPoint.tideHeight ?? '--'}
                            </span>
                            <span className="text-xl font-bold text-zinc-600 uppercase">
                              {floodPointStatus?.preciseData.unitTide ?? selectedFloodPoint.tideUnit ?? 'm'}
                            </span>
                          </div>
                          <p className="text-xs text-red-400 font-medium flex items-center gap-2 pt-2">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {floodPointStatus?.preciseData.message || (selectedFloodPoint.active ? 'Monitoramento Ativo' : 'Inativo')}
                          </p>
                        </div>
                        <div className="h-24 w-24 rounded-3xl flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity bg-red-600">
                          <Waves className="h-16 w-16" />
                        </div>
                      </div>

                      <div className="bg-zinc-800/30 p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Análise Ambiental</p>
                            <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase">
                               {floodPointStatus?.preciseData.source || 'Referência Local'}
                            </div>
                         </div>
                         <div className="pt-4 space-y-3">
                            {floodPointStatus?.preciseData.precipitation !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Precipitação</span>
                                <span className="text-sm font-black text-white">{floodPointStatus?.preciseData.precipitation} mm</span>
                              </div>
                            )}
                            {floodPointStatus?.preciseData.temperature !== null && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Temperatura</span>
                                <span className="text-sm font-black text-white">{floodPointStatus?.preciseData.temperature} °C</span>
                              </div>
                            )}
                         </div>
                      </div>
                    </div>

                    {/* Marine & Tide Grid */}
                    {floodPointStatus && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                            <Waves className="h-4 w-4 text-blue-400" /> Condições Marítimas
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
                              <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Altura das Ondas</p>
                              <p className="text-lg font-black text-white">{floodPointStatus.preciseData.waveHeight ?? '--'} m</p>
                            </div>
                            <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
                              <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Período</p>
                              <p className="text-lg font-black text-white">{floodPointStatus.preciseData.wavePeriod ?? '--'} s</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                            <Clock className="h-4 w-4 text-emerald-400" /> Tábuas de Maré (Previsto)
                          </h4>
                          <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                             <div>
                               <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Referência Tábua</p>
                               <p className="text-lg font-black text-emerald-500 mt-1">
                                 {floodPointStatus.preciseData.tideHeightTabuaMare ?? '--'} m
                               </p>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Fonte</p>
                                <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">DevTu / Porto</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Technical Specs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                          <Info className="h-4 w-4 text-primary" /> Características do Local
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
                            <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Distância do Canal</p>
                            <p className="text-lg font-black text-white">{selectedFloodPoint.dist_canal_m !== null ? `${selectedFloodPoint.dist_canal_m} m` : 'N/A'}</p>
                          </div>
                          <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
                            <p className="text-[8px] text-zinc-500 uppercase font-black tracking-tighter">Bacia Hidrográfica</p>
                            <p className="text-sm font-bold text-white truncate">{selectedFloodPoint.bacia_hidrografica || 'Não informada'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-zinc-800 pb-2">
                          <Activity className="h-4 w-4 text-emerald-400" /> Sensores Vinculados
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                             <div>
                               <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Estação Pluviométrica</p>
                               <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
                                 {selectedFloodPoint.config_sensores?.estacao_pluviometrica_id || 'Nenhum sensor configurado'}
                               </p>
                             </div>
                             <CloudRain className="h-4 w-4 text-zinc-700" />
                          </div>
                          <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                             <div>
                               <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Estação Nível do Rio</p>
                               <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
                                 {selectedFloodPoint.config_sensores?.estacao_nivel_rio_id || 'Nenhum sensor configurado'}
                               </p>
                             </div>
                             <Waves className="h-4 w-4 text-zinc-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Geolocation Section */}
                    <div className="bg-zinc-950/60 p-6 rounded-2xl border border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                             <MapPin className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-white uppercase tracking-widest">Coordenadas Geográficas</p>
                             <p className="text-sm text-zinc-500 font-mono mt-1">
                               {selectedFloodPoint.latitude.toFixed(6)}, {selectedFloodPoint.longitude.toFixed(6)}
                             </p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-xs font-bold uppercase tracking-widest h-10 px-6"
                            onClick={() => {
                              setShowDetailCard(false);
                              mapRef.current?.flyTo({
                                center: [selectedFloodPoint.longitude, selectedFloodPoint.latitude],
                                zoom: 16
                              });
                            }}
                          >
                            Focar no Mapa
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-xs font-bold uppercase tracking-widest h-10 px-6"
                            onClick={() => window.open(`https://www.google.com/maps?q=${selectedFloodPoint.latitude},${selectedFloodPoint.longitude}`, '_blank')}
                          >
                            Abrir no Maps
                          </Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
        </main>
      </div>
    </div>
  );
};

export default MapView;
