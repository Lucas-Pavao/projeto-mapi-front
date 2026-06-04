import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MapPopup } from '@/components/ui/map';
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
  Clock,
  Waves,
  Navigation,
  CloudRain,
  BatteryCharging
} from 'lucide-react';

import { exportService } from '../services/export.service';
import { floodService } from '../services/flood.service';
import { getSensorConfig, getBatteryStatus } from '../utils/sensor';
import { SensorSidebar } from './SensorSidebar';
import { SensorPopup } from './SensorPopup';
import { FloodPointPopup } from './FloodPointPopup';
import { SensorDetailCard } from './SensorDetailCard';
import { FloodPointDetailCard } from './FloodPointDetailCard';
import { ReportFloodModal } from './ReportFloodModal';
import { useMapData } from '../hooks/useMapData';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';

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
    isFetchingStatus,
    setIsFetchingStatus,
    handleMapClick,
    handleSensorClick,
    handleFloodPointClick,
    closePopups
  } = useMapInteractions(sensors, floodPoints);

  const [activeLayers, setActiveLayers] = useState<string[]>(['Mista / Meteo', 'Geotécnica', 'Rio / Hidro', 'Chuva', 'Pontos Críticos']);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSeverity, setReportSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  const mapRef = useRef<MapRef>(null);

  // Fetch real-time status when a flood point is selected in detail view
  useEffect(() => {
    if (showDetailCard && selectedFloodPoint?.id_ponto) {
      let isMounted = true;
      const fetchStatus = async () => {
        setIsFetchingStatus(true);
        try {
          const data = await floodService.getPointStatus(selectedFloodPoint.id_ponto);
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
  }, [showDetailCard, selectedFloodPoint?.id_ponto, setIsFetchingStatus, setFloodPointStatus]);

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
            onSensorClick={handleSensorClick}
            onFloodPointClick={handleFloodPointClick}
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
          <MapControls showLocate showFullscreen position="bottom-right" />
          
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
                <div className="absolute right-14 top-0 bg-black/60 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl shadow-black/60 flex flex-col gap-1 w-48 animate-in slide-in-from-right-2 duration-200">
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
              return (
                <MapMarker 
                  key={sensor.id} 
                  longitude={sensor.longitude!} 
                  latitude={sensor.latitude!}
                  onClick={() => handleSensorClick(sensor)}
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

            {filteredFloodPointsForMap.map((point: FloodPointResponseDTO) => (
              <MapMarker 
                key={point.id} 
                longitude={point.longitude} 
                latitude={point.latitude}
                onClick={() => handleFloodPointClick(point)}
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
                <SensorPopup 
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
                <FloodPointPopup 
                  point={selectedFloodPoint}
                  onShowDetails={() => setShowDetailCard(true)}
                  prediction={floodPointStatus?.floodPrediction}
                />
              </MapPopup>
            )}

            {clickedLocation && (
              <MapPopup
                longitude={clickedLocation.lng}
                latitude={clickedLocation.lat}
                onClose={() => closePopups()}
                className="w-80 p-0 border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden rounded-2xl"
              >
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                     <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Informações do Local</h3>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                       <span className="text-[9px] text-zinc-500 font-bold uppercase">Coordenadas</span>
                       <span className="text-[10px] font-mono text-zinc-300">{clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}</span>
                    </div>

                    {isFetchingLocation ? (
                      <div className="py-4 flex flex-col items-center justify-center gap-2">
                         <div className="h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                         <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Analisando Terreno...</span>
                      </div>
                    ) : locationInfo && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                              <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">Temperatura</p>
                              <p className="text-sm font-black text-white">{locationInfo.preciseData.temperature ?? '--'}°C</p>
                           </div>
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                              <p className="text-[8px] text-zinc-600 font-black uppercase mb-1">Precipitação</p>
                              <p className="text-sm font-black text-white">{locationInfo.preciseData.precipitation ?? '--'} mm</p>
                           </div>
                        </div>

                        {nearestHarbor && (
                          <div className="bg-blue-600/10 p-3 rounded-xl border border-blue-500/20 flex justify-between items-center">
                             <div>
                               <p className="text-[8px] text-blue-400 font-black uppercase">Maré Prevista</p>
                               <p className="text-xs font-bold text-white mt-0.5">{(nearestHarbor as { name?: string }).name}</p>
                             </div>
                             <div className="text-right">
                               <p className="text-sm font-black text-blue-400">{locationInfo.preciseData.tideHeightTabuaMare ?? '--'} m</p>
                             </div>
                          </div>
                        )}
                        
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                           <div className="flex justify-between items-center">
                             <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Sensor mais próximo</p>
                             <span className="text-xs font-black text-white leading-none mt-1">{locationInfo.distanceToNearestSensorKm.toFixed(1)}km</span>
                           </div>
                           {locationInfo.nearestSensor && (
                            <div 
                              className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-colors"
                              onClick={() => handleSensorClick(locationInfo.nearestSensor)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-lg",
                                  getSensorConfig(locationInfo.nearestSensor).color
                                )}>
                                  {React.createElement(getSensorConfig(locationInfo.nearestSensor).icon, { className: "h-4 w-4" })}
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[120px]">
                                     {locationInfo.nearestSensor.stationName}
                                   </p>
                                   <p className="text-[8px] text-zinc-500 font-bold uppercase truncate">
                                     {locationInfo.nearestSensor.municipality}
                                   </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-black text-white">
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
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </MapPopup>
            )}
          </Map>

          {showDetailCard && selectedSensor && (
            <SensorDetailCard 
              sensor={selectedSensor} 
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
        </main>
    </div>
  );
};

export default MapView;
