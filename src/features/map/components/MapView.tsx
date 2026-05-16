import React, { useEffect, useState, useRef } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map';
import type { MapRef } from '@/components/ui/map';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Thermometer, Battery, Waves, Activity, Layers, Settings, User } from 'lucide-react';
import { mapService } from '../services/map.service';
import type { SensorResponseDTO } from '../types';
import { SensorSidebar } from './SensorSidebar';
import { cn } from '@/lib/utils';

export const MapView: React.FC = () => {
  const { user, logout } = useAuth();
  const [sensors, setSensors] = useState<SensorResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSensorId, setSelectedSensorId] = useState<number>();
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const data = await mapService.getLatestSensors();
        setSensors(data);
      } catch (error) {
        console.error('Erro ao buscar sensores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSensors();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSensors, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSensorClick = (sensor: SensorResponseDTO) => {
    setSelectedSensorId(sensor.id);
    mapRef.current?.flyTo({
      center: [sensor.longitude, sensor.latitude],
      zoom: 15,
      duration: 2000
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background relative">
      {/* Floating Header Overlay */}
      <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-lg flex items-center gap-3 shadow-2xl">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">MAPI</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                Monitoramento
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-card/95 backdrop-blur-md border border-border px-4 py-2 rounded-lg flex items-center gap-3 shadow-2xl">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Operador</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-border">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="w-px h-4 bg-border mx-1" />
            <button 
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors"
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
          <div className="pointer-events-auto h-full shadow-2xl rounded-lg overflow-hidden border border-border">
            <SensorSidebar 
              sensors={sensors} 
              onSensorClick={handleSensorClick} 
              selectedSensorId={selectedSensorId}
            />
          </div>
        </div>

        <main className="flex-1 relative h-full w-full">
          {/* Map Controls Overlay */}
          <div className="absolute top-24 right-6 z-20 flex flex-col gap-2">
            <Button variant="secondary" size="icon" className="shadow-2xl rounded-lg h-10 w-10 bg-card/95 backdrop-blur-md border-border hover:bg-zinc-800 transition-all">
              <Layers className="h-5 w-5" />
            </Button>
            <Button variant="secondary" size="icon" className="shadow-2xl rounded-lg h-10 w-10 bg-card/95 backdrop-blur-md border-border hover:bg-zinc-800 transition-all">
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <Map
            ref={mapRef}
            center={[-34.877, -8.057]}
            zoom={12}
            className="h-full w-full"
            theme="dark"
          >
            <MapControls position="bottom-right" showZoom showLocate showFullscreen />
            
            {sensors.map((sensor) => (
              <MapMarker 
                key={sensor.id} 
                longitude={sensor.longitude} 
                latitude={sensor.latitude}
                onClick={() => setSelectedSensorId(sensor.id)}
              >
                <MarkerContent>
                  <div className="relative group cursor-pointer">
                    <div className={cn(
                      "absolute -inset-2 rounded-full animate-ping opacity-20",
                      sensor.type === 'Tide' ? 'bg-indigo-400' : 'bg-orange-400'
                    )} />
                    
                    <div className={cn(
                      "h-8 w-8 rounded-full border-2 border-zinc-950 shadow-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 z-10 relative",
                      sensor.type === 'Tide' ? 'bg-indigo-600' : 'bg-orange-600',
                      selectedSensorId === sensor.id ? 'ring-2 ring-white scale-110' : ''
                    )}>
                      {sensor.type === 'Tide' ? <Waves className="h-4 w-4" /> : <Thermometer className="h-4 w-4" />}
                    </div>
                  </div>
                </MarkerContent>
                <MarkerPopup className="p-0 border-none shadow-none">
                  <div className="bg-card text-foreground rounded-lg border border-border shadow-2xl overflow-hidden w-64 backdrop-blur-md">
                    <div className={cn(
                      "p-4 text-white font-bold flex flex-col gap-1 relative",
                      sensor.type === 'Tide' ? 'bg-indigo-600' : 'bg-orange-600'
                    )}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] opacity-80 uppercase tracking-widest">{sensor.type}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      </div>
                      <h3 className="text-sm leading-tight font-bold">{sensor.stationName}</h3>
                    </div>
                    
                    <div className="p-4 space-y-4 bg-card/95">
                      <div className="flex items-center justify-between">
                        <div>
                           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Última Leitura</p>
                           <p className="text-2xl font-black text-foreground">
                            {sensor.value} <small className="text-xs font-normal text-muted-foreground">{sensor.unit}</small>
                           </p>
                        </div>
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center bg-zinc-800/50 border border-border",
                          sensor.type === 'Tide' ? 'text-indigo-400' : 'text-orange-400'
                        )}>
                          {sensor.type === 'Tide' ? <Waves className="h-5 w-5" /> : <Thermometer className="h-5 w-5" />}
                        </div>
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Bateria</span>
                          <div className="flex items-center gap-1.5">
                            <Battery className={cn(
                              "h-3 w-3",
                              sensor.batteryStatus === 'Low' ? 'text-red-500' : 'text-emerald-500'
                            )} />
                            <span className="text-[10px] font-bold text-foreground uppercase">{sensor.batteryStatus}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Sincronizado</span>
                          <span className="text-[10px] font-bold text-foreground">
                            {new Date(sensor.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <Button className="w-full h-8 text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white">
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            ))}
          </Map>

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center p-8 rounded-lg bg-card border border-border shadow-2xl">
                <div className="relative h-12 w-12 mb-4">
                   <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                   <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                   <Activity className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                </div>
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Carregando Sistema</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MapView;
