import React from 'react';
import { Thermometer, Droplets, Battery, BatteryCharging } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO } from '../types';
import { getSensorConfig, getBatteryStatus } from '../utils/sensor';

interface SensorPopupProps {
  sensor: SensorResponseDTO;
  onShowDetails: () => void;
}

export const SensorPopup: React.FC<SensorPopupProps> = ({ sensor, onShowDetails }) => {
  const { isCharging, isLow, percentage } = getBatteryStatus(sensor.batteryStatus);
  const config = getSensorConfig(sensor);

  return (
    <div className="bg-black/60 backdrop-blur-xl text-white rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden w-72">
      <div className={cn(
        "p-4 text-white font-bold flex flex-col gap-1 relative",
        isCharging ? "bg-emerald-600/80" : config.color.replace('bg-', 'bg-') + '/80'
      )}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] opacity-80 uppercase tracking-widest">{config.label}</span>
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        </div>
        <h3 className="text-sm leading-tight font-bold">{sensor.stationName || 'Estação sem nome'}</h3>
        <p className="text-[10px] opacity-70 font-medium truncate">{sensor.municipality || 'Localidade não informada'}</p>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
             <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Leitura Principal</p>
             <p className="text-2xl font-black text-white">
              {sensor.value !== null ? sensor.value : '--'} <small className="text-xs font-normal text-zinc-500">{sensor.unit || ''}</small>
             </p>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner",
            isCharging ? "text-emerald-400" : config.text
          )}>
            {isCharging ? <BatteryCharging className="h-5 w-5" /> : React.createElement(config.icon, { className: "h-5 w-5" })}
          </div>
        </div>

        {(sensor.temperature !== null || sensor.humidity !== null) && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {sensor.temperature !== null && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                <Thermometer className="h-3 w-3 text-orange-400" />
                <span className="text-[10px] font-bold">{sensor.temperature}°C</span>
              </div>
            )}
            {sensor.humidity !== null && (
              <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                <Droplets className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] font-bold">{sensor.humidity}%</span>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2 pt-2 border-t border-white/5">
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
          className="w-full h-9 text-[10px] font-bold uppercase tracking-widest bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl transition-all"
        >
          Ver detalhes completos
        </Button>
      </div>
    </div>
  );
};
