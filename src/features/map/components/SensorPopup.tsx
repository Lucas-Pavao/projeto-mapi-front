import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Battery, 
  BatteryCharging, 
  Clock, 
  MapPin, 
  ExternalLink,
  Zap,
  CloudRain,
  Wind,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO, PreciseDataResponse } from '../types';
import { getSensorConfig, getBatteryStatus, getSafeFormattedDate } from '../utils/sensor';

interface SensorPopupProps {
  sensor: SensorResponseDTO;
  status?: PreciseDataResponse | null;
  isFetchingStatus?: boolean;
  onShowDetails: () => void;
}

export const SensorPopup: React.FC<SensorPopupProps> = ({ 
  sensor, 
  status,
  isFetchingStatus,
  onShowDetails 
}) => {
  const { isCharging, isLow, percentage } = getBatteryStatus(sensor.batteryStatus);
  const config = getSensorConfig(sensor);
  const precise = status?.preciseData;

  const getMetric = (sensorVal: number | null | undefined, preciseVal: number | null | undefined) => {
    if (sensorVal != null && typeof sensorVal === 'number') return sensorVal.toFixed(1);
    if (preciseVal != null && typeof preciseVal === 'number') return preciseVal.toFixed(1);
    return '--';
  };

  return (
    <div className="bg-zinc-900/95 backdrop-blur-xl text-white rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden w-80 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-200">
      {/* Header with Gradient */}
      <div className={cn(
        "px-5 py-4 text-white relative overflow-hidden",
        isCharging ? "bg-emerald-600/90" : config.color + "/90"
      )}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
           {React.createElement(config.icon, { className: "h-16 w-16 -mr-4 -mt-4 rotate-12" })}
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{config.label}</span>
              <div className="h-1 w-1 rounded-full bg-white/50" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">{sensor.source}</span>
            </div>
            <h3 className="text-sm font-black leading-tight tracking-tight drop-shadow-sm">{sensor.stationName || 'Estação sem nome'}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isFetchingStatus ? (
              <Loader2 className="h-4 w-4 text-white animate-spin opacity-50" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 mt-2 opacity-80 relative z-10">
          <MapPin className="h-3 w-3" />
          <p className="text-[10px] font-bold truncate tracking-tight">{sensor.municipality || 'Localidade não informada'}</p>
        </div>
      </div>
      
      <div className="p-5 space-y-5">
        {/* Main Reading Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Leitura Atual</p>
             <div className="flex items-baseline gap-1.5">
               <span className="text-4xl font-black text-white tracking-tighter italic">
                {sensor.value != null && typeof sensor.value === 'number' ? sensor.value.toFixed(1) : (sensor.value ?? '--')}
               </span>
               <span className="text-sm font-bold text-zinc-500 uppercase">{sensor.unit || ''}</span>
             </div>
          </div>
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner group transition-transform hover:scale-105 duration-300",
            isCharging ? "text-emerald-400" : config.text
          )}>
            {isCharging ? <BatteryCharging className="h-7 w-7" /> : React.createElement(config.icon, { className: "h-7 w-7" })}
          </div>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-colors">
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <Thermometer className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">Temp</span>
              <span className="text-xs font-black text-white">
                {getMetric(sensor.temperature, precise?.temperature)}
                <small className="ml-0.5 opacity-50">{precise?.unitTemperature || '°C'}</small>
              </span>
            </div>
          </div>
          
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-colors">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">Humid</span>
              <span className="text-xs font-black text-white">{getMetric(sensor.humidity, precise?.humidity)}%</span>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-colors">
            <div className="p-1.5 bg-sky-500/10 rounded-lg">
              <CloudRain className="h-3.5 w-3.5 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">Chuva</span>
              <span className="text-xs font-black text-white">
                {getMetric(sensor.accumulatedPrecipitation, precise?.precipitation)}
                <small className="ml-0.5 opacity-50">{precise?.unitPrecipitation || 'mm'}</small>
              </span>
            </div>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-3 group hover:bg-white/10 transition-colors">
            <div className="p-1.5 bg-slate-500/10 rounded-lg">
              <Wind className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">Vento</span>
              <span className="text-xs font-black text-white">
                {getMetric(sensor.windSpeed, precise?.windSpeed)}
                <small className="ml-0.5 opacity-50">{precise?.unitWindSpeed || 'km/h'}</small>
              </span>
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Battery className={cn(
                "h-3.5 w-3.5",
                isLow ? 'text-red-500' : 'text-emerald-500'
              )} />
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Status Energia</span>
            </div>
            <div className="flex items-center gap-1.5">
               {isCharging && <Zap className="h-3 w-3 text-emerald-400 animate-pulse" />}
               <span className={cn(
                 "text-[10px] font-black uppercase tracking-widest",
                 isLow ? "text-red-500" : "text-emerald-500"
               )}>
                  {percentage !== null ? `${percentage}%` : (sensor.batteryStatus || 'N/A')}
               </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Sincronização</span>
            </div>
            <span className="text-[10px] font-black text-zinc-300 uppercase">
              {sensor.timestamp ? getSafeFormattedDate(sensor.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--' : '--:--'}
            </span>
          </div>
        </div>

        <Button 
          onClick={onShowDetails}
          className="w-full h-10 text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 hover:bg-primary hover:text-white text-zinc-400 border border-white/5 hover:border-primary transition-all duration-300 rounded-xl group shadow-lg shadow-black/20"
        >
          <span>Analisar Dados Completos</span>
          <ExternalLink className="h-3 w-3 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
