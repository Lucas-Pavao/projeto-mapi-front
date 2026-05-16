import React, { useEffect, useState, useRef } from 'react';
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map';
import type { MapRef } from '@/components/ui/map';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Thermometer, 
  Battery, 
  Waves, 
  Activity, 
  Layers, 
  Settings, 
  User, 
  CloudRain,
  MapPin,
  Wind,
  Droplets,
  Sun,
  Cloud,
  X as CloseIcon
} from 'lucide-react';
import { mapService } from '../services/map.service';
import type { SensorResponseDTO, WeatherResponseDTO } from '../types';
import { SensorSidebar } from './SensorSidebar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const MapView: React.FC = () => {
  const { user, logout } = useAuth();
  const [sensors, setSensors] = useState<SensorResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSensorId, setSelectedSensorId] = useState<number>();
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationInfo, setLocationInfo] = useState<WeatherResponseDTO | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
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

  const handleMapClick = async (e: any) => {
    const { lng, lat } = e.lngLat;
    setClickedLocation({ lat, lng });
    setIsFetchingLocation(true);
    setLocationInfo(null);
    try {
      const data = await mapService.getWeather(lat, lng);
      setLocationInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações do local:', error);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleCloseLocationInfo = () => {
    setClickedLocation(null);
    setLocationInfo(null);
  };

  const handleSensorClick = (sensor: SensorResponseDTO) => {
    setSelectedSensorId(sensor.id);
    mapRef.current?.flyTo({
      center: [sensor.longitude, sensor.latitude],
      zoom: 15,
      duration: 2000
    });
  };

  const getSensorConfig = (sensor: SensorResponseDTO) => {
    const source = sensor.source?.toUpperCase();
    if (source === 'ANA') {
      return { 
        icon: Waves, 
        color: 'bg-blue-600', 
        ping: 'bg-blue-400', 
        text: 'text-blue-400',
        label: 'Rio'
      };
    }
    if (source === 'APAC/CEMADEN') {
      return { 
        icon: CloudRain, 
        color: 'bg-sky-600', 
        ping: 'bg-sky-400', 
        text: 'text-sky-400',
        label: 'Chuva'
      };
    }
    return { 
      icon: Thermometer, 
      color: 'bg-orange-600', 
      ping: 'bg-orange-400', 
      text: 'text-orange-400',
      label: sensor.type
    };
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
              <Layers className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="secondary" size="icon" className="shadow-2xl rounded-lg h-10 w-10 bg-card/95 backdrop-blur-md border-border hover:bg-zinc-800 transition-all">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
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
              <MapMarker 
                longitude={clickedLocation.lng} 
                latitude={clickedLocation.lat}
              >
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

            {sensors.map((sensor) => {
              const config = getSensorConfig(sensor);
              return (
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
                        config.ping
                      )} />
                      
                      <div className={cn(
                        "h-8 w-8 rounded-full border-2 border-zinc-950 shadow-2xl flex items-center justify-center text-white transition-all group-hover:scale-110 z-10 relative",
                        config.color,
                        selectedSensorId === sensor.id ? 'ring-2 ring-white scale-110' : ''
                      )}>
                        <config.icon className="h-4 w-4" />
                      </div>
                    </div>
                  </MarkerContent>
                  <MarkerPopup className="p-0 border-none shadow-none">
                    <div className="bg-card text-foreground rounded-lg border border-border shadow-2xl overflow-hidden w-64 backdrop-blur-md">
                      <div className={cn(
                        "p-4 text-white font-bold flex flex-col gap-1 relative",
                        config.color
                      )}>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] opacity-80 uppercase tracking-widest">{config.label}</span>
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
                            config.text
                          )}>
                            <config.icon className="h-5 w-5" />
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
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">Fonte</span>
                            <span className="text-[10px] font-bold text-foreground uppercase">{sensor.source}</span>
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
              );
            })}
          </Map>

          {/* Location Info Card */}
          {(clickedLocation || isFetchingLocation) && (
            <div className="absolute bottom-10 right-20 z-30 w-80 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Card className="shadow-2xl border-border bg-card/95 backdrop-blur-md overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border bg-zinc-800/20">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">Localização</CardTitle>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {clickedLocation ? `${clickedLocation.lat.toFixed(4)}, ${clickedLocation.lng.toFixed(4)}` : 'Buscando...'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-zinc-800"
                    onClick={handleCloseLocationInfo}
                  >
                    <CloseIcon className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {isFetchingLocation ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-3">
                      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Buscando dados...</p>
                    </div>
                  ) : locationInfo ? (
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Temperatura</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-foreground">{locationInfo.current.temperature_2m.toFixed(1)}</span>
                            <span className="text-sm font-medium text-muted-foreground">°C</span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                           <Thermometer className="h-6 w-6 text-orange-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-zinc-800/30 border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="h-3 w-3 text-blue-400" />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Umidade</span>
                          </div>
                          <p className="text-sm font-bold text-foreground">{locationInfo.current.relative_humidity_2m}%</p>
                        </div>
                        <div className="bg-zinc-800/30 border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Sensação</span>
                          </div>
                          <p className="text-sm font-bold text-foreground">{locationInfo.current.apparent_temperature.toFixed(1)}°C</p>
                        </div>
                      </div>

                      <div className="bg-zinc-800/30 border border-border rounded-lg p-3 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                               {locationInfo.current.weather_code <= 3 ? <Sun className="h-4 w-4 text-yellow-500" /> : 
                                locationInfo.current.weather_code <= 48 ? <Cloud className="h-4 w-4 text-zinc-400" /> : 
                                <CloudRain className="h-4 w-4 text-blue-400" />}
                            </div>
                            <div>
                               <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Condição</p>
                               <p className="text-xs font-bold text-foreground">
                                 {locationInfo.current.is_day ? 'Dia' : 'Noite'} • {
                                   locationInfo.current.weather_code === 0 ? 'Céu Limpo' :
                                   locationInfo.current.weather_code <= 3 ? 'Parcialmente Nublado' :
                                   locationInfo.current.weather_code <= 48 ? 'Nevoeiro' :
                                   'Chuva'
                                 }
                               </p>
                            </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs text-muted-foreground">Não foi possível carregar os dados deste local.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

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
