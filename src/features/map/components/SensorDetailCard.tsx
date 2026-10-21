import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Clock,
  X as CloseIcon,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Sun,
  Gauge,
  ShieldAlert,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalDialog } from '@/components/ui/modal-dialog';
import type { SensorResponseDTO, PreciseDataResponse } from '../types';
import { getSensorConfig, getDataFreshness, getSafeFormattedDate } from '../utils/sensor';

interface SensorDetailCardProps {
  sensor: SensorResponseDTO;
  status?: PreciseDataResponse | null;
  onClose: () => void;
}

export const SensorDetailCard: React.FC<SensorDetailCardProps> = ({ sensor, status, onClose }) => {
  const config = getSensorConfig(sensor);
  const freshness = getDataFreshness(sensor.timestamp);
  const precise = status?.preciseData;
  const hasRiverAlert = sensor.riverPreAlertLevel != null || sensor.riverAlertLevel != null || sensor.riverFloodLevel != null;

  const formatValue = (val: number | null | undefined, decimals: number) => {
    if (val != null && typeof val === 'number') return val.toFixed(decimals);
    return '--';
  };

  return (
    <ModalDialog label={`Detalhes do sensor ${sensor.stationName ?? sensor.sensorId}`} onClose={onClose} className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl max-h-[90vh] shadow-elevation-overlay border-border bg-card overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-border">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border bg-muted shrink-0">
          <div className="flex items-center gap-4 text-foreground">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-elevation-overlay border border-border",
              config.color, 'text-background'
            )}>
              {React.createElement(config.icon, { className: "h-7 w-7" })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">
                  {sensor.stationName || 'Estação sem nome'}
                </CardTitle>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold border border-border">
                  {sensor.source}
                </span>
              </div>
              <p className="text-2xs text-muted-foreground font-bold mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {sensor.municipality || 'Localidade não informada'} • {sensor.type || 'Tipo não informado'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" 
            onClick={onClose}
            aria-label="Fechar detalhes do sensor"
          >
            <CloseIcon className="h-6 w-6" aria-hidden="true" />
          </Button>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden flex flex-col">
          <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Primary highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-muted p-6 rounded-2xl border border-border shadow-elevation-overlay flex items-center justify-between group">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-bold">Leitura atual</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-foreground">
                      {sensor.value != null && typeof sensor.value === 'number' ? sensor.value.toFixed(2) : (sensor.value ?? '--')}
                    </span>
                    <span className="text-xl font-bold text-muted-foreground">
                      {sensor.unit || ''}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 pt-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Sincronizado em {sensor.timestamp ? getSafeFormattedDate(sensor.timestamp)?.toLocaleString('pt-BR') || 'Data não disponível' : 'Data não disponível'}
                  </p>
                </div>
                <div className={cn(
                  "h-24 w-24 rounded-2xl flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity",
                  config.color
                )}>
                  {React.createElement(config.icon, { className: "h-16 w-16" })}
                </div>
              </div>

              <div className="bg-muted p-6 rounded-2xl border border-border flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <p className="text-xs text-muted-foreground font-bold">Status da coleta</p>
                    <div className={cn(
                      "px-2 py-1 rounded-lg flex items-center gap-1.5 text-2xs font-bold border",
                      freshness.status === 'fresh' && "bg-success/10 text-success border-success/40",
                      freshness.status === 'aging' && "bg-warning/10 text-warning border-warning/40",
                      freshness.status === 'stale' && "bg-destructive/10 text-destructive border-destructive/40"
                    )}>
                       <div className={cn("h-2 w-2 rounded-full", freshness.dot, freshness.status === 'fresh' && "animate-pulse")} />
                       {freshness.label}
                    </div>
                 </div>
                 <div className="pt-4">
                    <p className="text-3xl font-bold text-foreground leading-none">
                      {freshness.minutesAgo != null ? freshness.minutesAgo : '--'}
                      <span className="text-xs text-muted-foreground font-bold ml-1.5">min atrás</span>
                    </p>
                    <p className="text-2xs text-muted-foreground font-bold text-right mt-3">
                      Fonte: {sensor.source || 'N/A'}
                    </p>
                 </div>
              </div>
            </div>

            {/* River alert section — thresholds oficiais da APAC (só aparece pra estações fluviométricas) */}
            {hasRiverAlert && (
              <div className="bg-muted p-6 rounded-2xl border border-destructive/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xs text-destructive font-bold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Alerta oficial de rio (APAC)
                  </h4>
                  {sensor.riverName && (
                    <span className="text-2xs text-muted-foreground font-bold flex items-center gap-1.5">
                      <Waves className="h-3 w-3 text-destructive" /> {sensor.riverName}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted p-4 rounded-xl border border-border">
                    <p className="text-2xs text-muted-foreground font-bold">Nível atual</p>
                    <p className="text-lg font-bold text-foreground mt-1">{formatValue(sensor.waterLevel, 1)}</p>
                  </div>
                  <div className="bg-warning/10 p-4 rounded-xl border border-warning/40">
                    <p className="text-2xs text-warning font-bold">Pré-Alerta</p>
                    <p className="text-lg font-bold text-warning mt-1">{formatValue(sensor.riverPreAlertLevel, 1)}</p>
                  </div>
                  <div className="bg-warning/10 p-4 rounded-xl border border-warning/40">
                    <p className="text-2xs text-warning font-bold">Alerta</p>
                    <p className="text-lg font-bold text-warning mt-1">{formatValue(sensor.riverAlertLevel, 1)}</p>
                  </div>
                  <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/40">
                    <p className="text-2xs text-destructive font-bold">Inundação</p>
                    <p className="text-lg font-bold text-destructive mt-1">{formatValue(sensor.riverFloodLevel, 1)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Technical & Environmental grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-2xs text-muted-foreground font-bold flex items-center gap-2 border-b border-border pb-2">
                  <Thermometer className="h-4 w-4 text-primary" /> Dados ambientais
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Temperatura', value: sensor.temperature ?? precise?.temperature, unit: precise?.unitTemperature || '°C', icon: Thermometer, color: 'text-warning' },
                    { label: 'Umidade', value: sensor.humidity ?? precise?.humidity, unit: '%', icon: Droplets, color: 'text-chart-1' },
                    { label: 'Vento', value: sensor.windSpeed ?? precise?.windSpeed, unit: precise?.unitWindSpeed || 'km/h', icon: Wind, color: 'text-success' },
                    { label: 'Radiação', value: sensor.solarRadiation ?? precise?.solarRadiation, unit: precise?.unitSolarRadiation || 'W/m²', icon: Sun, color: 'text-warning' },
                    { label: 'Chuva (Satélite)', value: precise?.precipitation, unit: precise?.unitPrecipitation || 'mm', icon: CloudRain, color: 'text-chart-1' },
                    ].map((item, idx) => (
                    <div key={idx} className="bg-muted p-4 rounded-xl border border-border hover:bg-secondary transition-colors group">
                      <div className="flex justify-between items-center mb-1">
                         <item.icon className={cn("h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity", item.color)} />
                         <span className="text-2xs text-muted-foreground font-bold">{item.label}</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {item.value != null && typeof item.value === 'number' ? item.value.toFixed(1) : (item.value ?? '--')} <span className="text-2xs text-muted-foreground font-bold">{item.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-2xs text-muted-foreground font-bold flex items-center gap-2 border-b border-border pb-2">
                  <Gauge className="h-4 w-4 text-primary" /> Contexto preciso
                </h4>
                <div className="bg-muted p-4 rounded-2xl border border-border space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded-xl border border-border flex flex-col justify-between">
                       <p className="text-2xs text-muted-foreground font-bold">Pressão atmosférica</p>
                       <p className="text-xs font-bold text-foreground mt-1">{formatValue(precise?.pressure, 1)} <small className="opacity-50 ml-0.5">{precise?.unitPressure || 'hPa'}</small></p>
                    </div>
                    <div className="bg-muted p-3 rounded-xl border border-border flex flex-col justify-between">
                       <p className="text-2xs text-muted-foreground font-bold">Maré estimada</p>
                       <p className="text-xs font-bold text-foreground mt-1">{formatValue(precise?.tideHeightTabuaMare, 2)} <small className="opacity-50 ml-0.5">{precise?.unitTide || 'm'}</small></p>
                    </div>
                    <div className="bg-muted p-3 rounded-xl border border-border flex flex-col justify-between">
                       <p className="text-2xs text-muted-foreground font-bold">Chuva (Satélite)</p>
                       <p className="text-xs font-bold text-foreground mt-1">{formatValue(precise?.precipitation, 1)} <small className="opacity-50 ml-0.5">{precise?.unitPrecipitation || 'mm'}</small></p>
                    </div>
                    <div className="bg-muted p-3 rounded-xl border border-border flex flex-col justify-between">
                       <p className="text-2xs text-muted-foreground font-bold">Vazão estimada</p>
                       <p className="text-xs font-bold text-chart-1 mt-1">{formatValue(precise?.flowRate, 2)} <small className="opacity-50 ml-0.5">{precise?.unitFlowRate || 'm³/s'}</small></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Geolocation section */}
            <div className="bg-muted p-6 rounded-2xl border border-border flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                     <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-foreground">Coordenadas geográficas</p>
                     <p className="text-sm text-muted-foreground font-mono mt-1">
                       {sensor.latitude != null && sensor.longitude != null && typeof sensor.latitude === 'number' && typeof sensor.longitude === 'number'
                         ? `${sensor.latitude.toFixed(6)}, ${sensor.longitude.toFixed(6)}` 
                         : 'N/A'}
                     </p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-muted border-border text-muted-foreground hover:text-foreground text-2xs font-bold px-4 h-10 rounded-xl transition-all">
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" className="bg-muted border-border text-muted-foreground hover:text-foreground text-2xs font-bold px-4 h-10 rounded-xl transition-all">
                    Navegar
                  </Button>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ModalDialog>
  );
};
