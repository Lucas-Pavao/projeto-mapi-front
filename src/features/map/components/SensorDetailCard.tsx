import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Battery, 
  BatteryCharging, 
  Clock, 
  X as CloseIcon, 
  Zap,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO } from '../types';
import { getSensorConfig, getBatteryStatus } from '../utils/sensor';

interface SensorDetailCardProps {
  sensor: SensorResponseDTO;
  onClose: () => void;
}

export const SensorDetailCard: React.FC<SensorDetailCardProps> = ({ sensor, onClose }) => {
  const { isCharging, isLow, percentage } = getBatteryStatus(sensor.batteryStatus);
  const config = getSensorConfig(sensor);

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl max-h-[90vh] shadow-2xl border-white/10 bg-zinc-950/60 backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-white/5">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-white/5 bg-white/5 shrink-0">
          <div className="flex items-center gap-4 text-white">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/10", 
              isCharging ? "bg-emerald-600/80" : config.color.replace('bg-', 'bg-') + '/80'
            )}>
              {isCharging ? (
                <BatteryCharging className="h-7 w-7" />
              ) : (
                React.createElement(config.icon, { className: "h-7 w-7" })
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {sensor.stationName || 'Estação sem nome'}
                </CardTitle>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-bold uppercase border border-white/5">
                  {sensor.source}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {sensor.municipality || 'Localidade não informada'} • {sensor.type || 'Tipo não informado'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" 
            onClick={onClose}
          >
            <CloseIcon className="h-6 w-6" />
          </Button>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden flex flex-col">
          <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Primary Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between group">
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-[0.2em]">Leitura Atual</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-white tracking-tighter">
                      {sensor.value !== null ? sensor.value : '--'}
                    </span>
                    <span className="text-xl font-bold text-zinc-600 uppercase">
                      {sensor.unit || ''}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-2 pt-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Sincronizado em {sensor.timestamp ? new Date(sensor.timestamp).toLocaleString('pt-BR') : 'Data não disponível'}
                  </p>
                </div>
                <div className={cn(
                  "h-24 w-24 rounded-3xl flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity",
                  config.color
                )}>
                  {React.createElement(config.icon, { className: "h-16 w-16" })}
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Bateria</p>
                    <div className={cn(
                      "px-2 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase",
                      isLow ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    )}>
                       {isCharging ? <Zap className="h-3 w-3 animate-pulse" /> : <Battery className="h-3 w-3" />}
                       {percentage !== null ? `${percentage}%` : (sensor.batteryStatus || 'N/A')}
                    </div>
                 </div>
                 <div className="pt-4">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                       <div 
                         className={cn(
                           "h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
                           isLow ? "bg-red-500" : "bg-emerald-500"
                         )} 
                         style={{ width: `${percentage || 0}%` }}
                       />
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase text-right">
                      Status: {isCharging ? 'Carregando' : 'Operando'}
                    </p>
                 </div>
              </div>
            </div>

            {/* Technical & Environmental Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                  <Thermometer className="h-4 w-4 text-primary" /> Dados Ambientais
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Temperatura', value: sensor.temperature, unit: '°C', icon: Thermometer, color: 'text-orange-400' },
                    { label: 'Umidade', value: sensor.humidity, unit: '%', icon: Droplets, color: 'text-blue-400' },
                    { label: 'Vento', value: sensor.windSpeed, unit: 'km/h', icon: Wind, color: 'text-emerald-400' },
                    { label: 'Radiação', value: sensor.solarRadiation, unit: 'W/m²', icon: Sun, color: 'text-yellow-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                      <div className="flex justify-between items-center mb-1">
                         <item.icon className={cn("h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity", item.color)} />
                         <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">{item.label}</span>
                      </div>
                      <p className="text-lg font-black text-white">
                        {item.value !== null ? item.value : '--'} <span className="text-[10px] text-zinc-600 font-bold">{item.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                  <Activity className="h-4 w-4 text-primary" /> Especificações Técnicas
                </h4>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                       <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Bacia Hidrográfica</p>
                       <p className="text-xs font-bold text-zinc-300 mt-1 truncate">{sensor.basinName || 'Não especificada'}</p>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                       <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Código da Estação</p>
                       <p className="text-xs font-mono font-bold text-zinc-300 mt-1">{sensor.code || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Geolocation Section */}
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500">
                     <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-white uppercase tracking-widest">Coordenadas Geográficas</p>
                     <p className="text-sm text-zinc-500 font-mono mt-1">
                       {sensor.latitude !== null && sensor.longitude !== null 
                         ? `${sensor.latitude.toFixed(6)}, ${sensor.longitude.toFixed(6)}` 
                         : 'N/A'}
                     </p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-zinc-400 hover:text-white text-[10px] uppercase font-bold tracking-widest px-4 h-10 rounded-xl transition-all">
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-zinc-400 hover:text-white text-[10px] uppercase font-bold tracking-widest px-4 h-10 rounded-xl transition-all">
                    Navegar
                  </Button>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
