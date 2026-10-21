import React from 'react';
import {
  Thermometer,
  Droplets,
  Clock,
  MapPin,
  ExternalLink,
  CloudRain,
  Wind,
  Loader2,
  Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SensorResponseDTO, PreciseDataResponse } from '../types';
import { getSensorConfig, getDataFreshness, getSafeFormattedDate } from '../utils/sensor';

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
  const config = getSensorConfig(sensor);
  const freshness = getDataFreshness(sensor.timestamp);
  const precise = status?.preciseData;
  const hasRiverAlert = sensor.riverPreAlertLevel != null || sensor.riverAlertLevel != null || sensor.riverFloodLevel != null;

  const getMetric = (sensorVal: number | null | undefined, preciseVal: number | null | undefined) => {
    if (sensorVal != null && typeof sensorVal === 'number') return sensorVal.toFixed(1);
    if (preciseVal != null && typeof preciseVal === 'number') return preciseVal.toFixed(1);
    return '--';
  };

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col bg-popover text-foreground rounded-2xl border border-border shadow-elevation-overlay overflow-hidden w-80 ring-1 ring-border animate-in fade-in zoom-in-95 duration-200">
      {/* Header with Gradient (fixo; só o corpo rola) */}
      <div className={cn("shrink-0 px-5 py-4 text-background relative overflow-hidden", config.color)}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
           {React.createElement(config.icon, { className: "h-16 w-16 -mr-4 -mt-4 rotate-12" })}
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-2xs font-bold opacity-80">{config.label}</span>
              <div className="h-1 w-1 rounded-full bg-muted-foreground" />
              <span className="text-2xs font-bold opacity-60">{sensor.source}</span>
            </div>
            <h3 className="text-sm font-bold leading-tight drop-shadow-sm">{sensor.stationName || 'Estação sem nome'}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isFetchingStatus ? (
              <Loader2 className="h-4 w-4 text-foreground animate-spin opacity-50" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 mt-2 opacity-80 relative z-10">
          <MapPin className="h-3 w-3" />
          <p className="text-2xs font-bold truncate">{sensor.municipality || 'Localidade não informada'}</p>
        </div>
      </div>
      
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
        {/* Main reading section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <p className="text-2xs text-muted-foreground font-bold">Leitura atual</p>
             <div className="flex items-baseline gap-1.5">
               <span className="text-4xl font-bold text-foreground">
                {sensor.value != null && typeof sensor.value === 'number' ? sensor.value.toFixed(1) : (sensor.value ?? '--')}
               </span>
               <span className="text-sm font-bold text-muted-foreground">{sensor.unit || ''}</span>
             </div>
          </div>
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center bg-muted border border-border shadow-inner group transition-transform hover:scale-105 duration-300",
            config.text
          )}>
            {React.createElement(config.icon, { className: "h-7 w-7" })}
          </div>
        </div>

        {/* Secondary metrics grid */}
        {hasRiverAlert ? (
          <div className="space-y-2.5">
            {sensor.riverName && (
              <div className="flex items-center gap-1.5 text-destructive">
                <Waves className="h-3 w-3" />
                <span className="text-2xs font-bold">{sensor.riverName}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-warning/10 p-2.5 rounded-xl border border-warning/40 flex flex-col items-center text-center">
                <span className="text-2xs text-warning font-bold">Pré-Alerta</span>
                <span className="text-xs font-bold text-warning">{getMetric(sensor.riverPreAlertLevel, null)}</span>
              </div>
              <div className="bg-warning/10 p-2.5 rounded-xl border border-warning/40 flex flex-col items-center text-center">
                <span className="text-2xs text-warning font-bold">Alerta</span>
                <span className="text-xs font-bold text-warning">{getMetric(sensor.riverAlertLevel, null)}</span>
              </div>
              <div className="bg-destructive/10 p-2.5 rounded-xl border border-border flex flex-col items-center text-center">
                <span className="text-2xs text-destructive font-bold">Inundação</span>
                <span className="text-xs font-bold text-destructive">{getMetric(sensor.riverFloodLevel, null)}</span>
              </div>
            </div>
            <p className="text-2xs text-muted-foreground font-medium px-0.5">Limiares oficiais da APAC para este ponto do rio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-muted p-2.5 rounded-xl border border-border flex items-center gap-3 group hover:bg-secondary transition-colors">
              <div className="p-1.5 bg-warning/10 rounded-lg">
                <Thermometer className="h-3.5 w-3.5 text-warning" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs text-muted-foreground font-bold">Temp</span>
                <span className="text-xs font-bold text-foreground">
                  {getMetric(sensor.temperature, precise?.temperature)}
                  <small className="ml-0.5 opacity-50">{precise?.unitTemperature || '°C'}</small>
                </span>
              </div>
            </div>

            <div className="bg-muted p-2.5 rounded-xl border border-border flex items-center gap-3 group hover:bg-secondary transition-colors">
              <div className="p-1.5 bg-chart-1/10 rounded-lg">
                <Droplets className="h-3.5 w-3.5 text-chart-1" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs text-muted-foreground font-bold">Humid</span>
                <span className="text-xs font-bold text-foreground">{getMetric(sensor.humidity, precise?.humidity)}%</span>
              </div>
            </div>

            <div className="bg-muted p-2.5 rounded-xl border border-border flex items-center gap-3 group hover:bg-secondary transition-colors">
              <div className="p-1.5 bg-chart-1/10 rounded-lg">
                <CloudRain className="h-3.5 w-3.5 text-chart-1" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs text-muted-foreground font-bold">Chuva</span>
                <span className="text-xs font-bold text-foreground">
                  {getMetric(sensor.accumulatedPrecipitation, precise?.precipitation)}
                  <small className="ml-0.5 opacity-50">{precise?.unitPrecipitation || 'mm'}</small>
                </span>
              </div>
            </div>

            <div className="bg-muted p-2.5 rounded-xl border border-border flex items-center gap-3 group hover:bg-secondary transition-colors">
              <div className="p-1.5 bg-muted rounded-lg">
                <Wind className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xs text-muted-foreground font-bold">Vento</span>
                <span className="text-xs font-bold text-foreground">
                  {getMetric(sensor.windSpeed, precise?.windSpeed)}
                  <small className="ml-0.5 opacity-50">{precise?.unitWindSpeed || 'km/h'}</small>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={cn("h-2.5 w-2.5 rounded-full", freshness.dot, freshness.status === 'fresh' && "animate-pulse")} />
              <span className="text-2xs text-muted-foreground font-bold">Status da Coleta</span>
            </div>
            <span className={cn("text-2xs font-bold", freshness.text)}>
              {freshness.label}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-2xs text-muted-foreground font-bold">Última leitura</span>
            </div>
            <span className="text-2xs font-bold text-foreground">
              {sensor.timestamp ? getSafeFormattedDate(sensor.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--' : '--:--'}
            </span>
          </div>
        </div>

        <Button 
          onClick={onShowDetails}
          className="w-full h-10 text-2xs font-bold bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-border hover:border-primary transition-all duration-300 rounded-xl group shadow-elevation-raised"
        >
          <span>Analisar dados completos</span>
          <ExternalLink className="h-3 w-3 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
