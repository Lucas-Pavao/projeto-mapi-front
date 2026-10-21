import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  X as CloseIcon, 
  Zap,
  AlertTriangle,
  Waves,
  CloudRain,
  Activity,
  FileDown,
  Wind,
  ShieldAlert,
  Thermometer,
  Navigation,
  Database,
  Gauge,
  Cpu,
  Droplets,
  Layers,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalDialog } from '@/components/ui/modal-dialog';
import { getSafeFormattedDate } from '../utils/sensor';
import { getRiskVisual, formatProbability, showsExperimentalLabel } from '@/components/risk/risk';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { formatRecife } from '../utils/datetime';
import { PredictionUnavailableNotice } from './PredictionUnavailableNotice';
import { InfoHint } from './InfoHint';
import { TerrainFacts } from './TerrainFacts';
import { resolveRain, TIDE_UNIT, TIDE_NOTE } from '../utils/provenance';
import type { FloodPointResponseDTO, PreciseDataResponse, PreciseData } from '../types';

interface FloodPointDetailCardProps {
  point: FloodPointResponseDTO;
  status: PreciseDataResponse | null;
  isFetchingStatus: boolean;
  onClose: () => void;
  onReportFlood: () => void;
  onExportCsv: () => void;
  onFocusMap: () => void;
}

export const FloodPointDetailCard: React.FC<FloodPointDetailCardProps> = ({ 
  point, 
  status, 
  isFetchingStatus, 
  onClose,
  onReportFlood,
  onExportCsv,
  onFocusMap
}) => {
  const prediction = status?.floodPrediction;
  const precise = status?.preciseData;

  const getMetricValue = (key: keyof PreciseData, fallback?: number | null) => {
    // 1. Precise Data (Best)
    if (precise?.[key] != null) return precise[key] as number;
    
    // 2. Nearest Sensor (Good) - Explicit mapping to avoid 'any'
    const sensor = status?.nearestSensor;
    if (sensor) {
      switch (key) {
        case 'temperature': if (sensor.temperature != null) return sensor.temperature; break;
        case 'humidity': if (sensor.humidity != null) return sensor.humidity; break;
        case 'pressure': if (sensor.pressure != null) return sensor.pressure; break;
        case 'windSpeed': if (sensor.windSpeed != null) return sensor.windSpeed; break;
        case 'precipitation': if (sensor.accumulatedPrecipitation != null) return sensor.accumulatedPrecipitation; break;
        case 'waterLevel': if (sensor.waterLevel != null) return sensor.waterLevel; break;
        case 'flowRate': if (sensor.flowRate != null) return sensor.flowRate; break;
        case 'tideHeight': if (sensor.tideHeight != null) return sensor.tideHeight; break;
      }
    }

    // 3. OpenMeteo (Fallback)
    if (fallback != null) return fallback;
    return null;
  };

  const formatValue = (val: number | null | undefined, decimals: number) => {
    if (val != null && typeof val === 'number') return val.toFixed(decimals);
    return '--';
  };

  const rain = resolveRain({
    precise,
    sensor: status?.nearestSensor,
    openMeteoPrecipitation: status?.openMeteoData?.current?.precipitation,
  });

  const visual = getRiskVisual(prediction?.riskLevel);
  const risk = { color: visual.text, border: visual.border, bg: visual.softBg, header: visual.header, label: visual.label };
  const probability = formatProbability(prediction?.riskLevel, prediction?.floodProbability);
  const isUnknown = !visual.showsProbability;
  const issuedAt = formatRecife(prediction?.issuedAt);
  const validUntil = formatRecife(prediction?.validUntil);

  return (
    <ModalDialog label={`Detalhes do ponto crítico ${point.name}`} onClose={onClose} className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <Card className="w-full max-w-6xl max-h-[95vh] shadow-elevation-overlay border-border bg-card overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col ring-1 ring-border rounded-2xl">
        
        {/* Immersive header */}
        <CardHeader className={cn(
          "pb-6 pt-8 px-8 flex flex-row items-center justify-between border-b border-border relative overflow-hidden shrink-0 transition-colors duration-1000",
          risk.bg
        )}>
          <div className="flex items-center gap-6 text-foreground relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center shadow-elevation-overlay border border-border ring-4 ring-border transition-all duration-1000",
              risk.header
            )}>
              <ShieldAlert className="h-9 w-9" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-bold leading-none">
                  {point.name}
                </CardTitle>
                <div className="bg-secondary px-3 py-1 rounded-full border border-border">
                  <span className="text-2xs text-foreground font-bold">Ao vivo</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                 <p className="text-2xs text-muted-foreground font-bold flex items-center gap-1.5 bg-muted px-3 py-1 rounded-lg border border-border">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {point.municipality || 'Recife, PE'}
                 </p>
                 <div className="h-1 w-1 rounded-full bg-muted" />
                 <p className="text-2xs text-muted-foreground font-bold font-mono">NODE_ID: {point.slug}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
             <div className="text-right hidden md:block mr-2">
                <p className="text-2xs text-muted-foreground font-bold">Sincronização</p>
                <p className="text-xs font-bold text-success flex items-center justify-end gap-1.5">
                   <Activity className="h-3 w-3 animate-pulse" /> Em tempo real
                   {precise?.timestamp && (
                     <span className="text-2xs text-muted-foreground font-bold ml-2">
                       (Última: {getSafeFormattedDate(precise.timestamp)?.toLocaleTimeString('pt-BR') || '--:--'})
                     </span>
                   )}
                </p>
             </div>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-12 w-12 rounded-2xl bg-muted border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all shadow-elevation-overlay" 
               onClick={onClose}
               aria-label="Fechar detalhes do ponto"
             >
               <CloseIcon className="h-6 w-6" aria-hidden="true" />
             </Button>
          </div>

          {/* Decorative header background */}
          <div className="absolute right-0 top-0 w-1/3 h-full from-primary/5 opacity-50" />
        </CardHeader>

        <CardContent className="p-0 overflow-hidden flex flex-col">
          <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            {/* 1. Main analytical row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* IA Hero card */}
              <div className={cn(
                "lg:col-span-8 p-10 rounded-2xl border shadow-elevation-overlay flex flex-col md:flex-row items-center justify-between group relative overflow-hidden transition-all duration-1000",
                risk.border,
                risk.bg
              )}>
                {isFetchingStatus && (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative h-12 w-12">
                         <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                         <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                      <span className="text-2xs font-bold text-primary animate-pulse">Analisando…</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-8 relative z-10 flex-1">
                  <div className="flex items-center gap-3">
                     <div className="bg-primary/20 p-2 rounded-xl">
                        <Cpu className="h-4 w-4 text-primary" />
                     </div>
                     <p className="text-2xs text-muted-foreground font-bold">Predição estocástica (MAPi-IA)</p>
                  </div>

                  <div className="flex items-baseline gap-6">
                    {isUnknown ? (
                      <PredictionUnavailableNotice prediction={prediction} className="space-y-1 text-lg" />
                    ) : (
                      <>
                        <span className={cn(
                          "text-[9rem] font-bold leading-none transition-colors duration-1000",
                          risk.color
                        )}>
                          {probability ?? '--'}
                        </span>
                        <div className="flex flex-col gap-1">
                           <span className="text-xl font-bold text-foreground leading-none">Probabilidade</span>
                           {prediction?.modelVersion && (
                             <span className="text-2xs font-bold text-muted-foreground mt-2 border-l-2 border-primary pl-3">Modelo {prediction.modelVersion}</span>
                           )}
                           {issuedAt && <span className="text-2xs text-muted-foreground">Emitida em {issuedAt} (Recife)</span>}
                           {validUntil && <span className="text-2xs text-muted-foreground">Previsão para até {validUntil} (Recife)</span>}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {showsExperimentalLabel(prediction) && <ExperimentalBadge className="text-xs" />}

                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col items-start gap-1">
                      <p className="text-2xs text-muted-foreground font-bold leading-none">Nível de risco</p>
                      <RiskBadge level={prediction?.riskLevel} probability={prediction?.floodProbability} className="text-sm" />
                    </div>

                    {prediction?.estimatedTimeToEvent && (
                      <div className="px-6 py-3 rounded-2xl border border-border bg-muted flex items-center gap-4 shadow-elevation-raised">
                        <div className="bg-muted p-2 rounded-xl">
                           <History className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                           <p className="text-2xs text-muted-foreground font-bold leading-none mb-1">Impacto previsto</p>
                           <p className="text-base font-bold text-foreground leading-none">{prediction.estimatedTimeToEvent}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn(
                  "mt-8 md:mt-0 h-48 w-48 rounded-[3.5rem] flex items-center justify-center shadow-elevation-overlay relative z-10 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-6",
                  "bg-popover border border-border"
                )}>
                  <Zap className={cn("h-24 w-24 transition-colors duration-1000", "text-primary")} />
                  {/* Decorative internal rings */}
                  <div className="absolute inset-4 border border-border rounded-2xl" />
                  <div className="absolute inset-8 border border-border rounded-2xl opacity-50" />
                </div>
              </div>

              {/* Recommendation side card */}
              <div className="lg:col-span-4 bg-muted p-10 rounded-2xl border border-border flex flex-col justify-between relative overflow-hidden shadow-elevation-overlay">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] transition-transform duration-1000 group-hover:scale-125">
                    <Database className="h-40 w-40" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                       <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-2xs text-muted-foreground font-bold">IA Insights</p>
                       </div>
                    </div>
                    <p className="text-base text-foreground leading-relaxed font-medium">
                      "{prediction?.message || 'Coletando telemetria ambiental para processar recomendação automatizada via redes neurais...'}"
                    </p>
                 </div>
                 <div className="pt-10 border-t border-border flex justify-between items-center relative z-10">
                    <div>
                       <p className="text-2xs font-bold text-muted-foreground leading-none mb-1">Fonte</p>
                       <p className="text-2xs font-bold text-muted-foreground">Processamento local</p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-xl border border-border">
                       <div className={cn(
                         "h-2 w-2 rounded-full",
                         point.active ? "bg-success animate-pulse" : "bg-muted"
                       )} />
                       <span className="text-2xs font-bold text-foreground">{point.active ? 'Ativo' : 'Offline'}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* 2. Environmental grid - High density */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { 
                   kind: 'other',
                   label: 'Telemetria térmica', 
                   value: getMetricValue('temperature', status?.openMeteoData?.current?.temperature_2m), 
                   unit: precise?.unitTemperature || '°C', icon: Thermometer, color: 'text-warning', bg: 'bg-warning/10' 
                 },
                 { 
                   kind: 'tide',
                   label: 'Status da maré', 
                   value: precise?.tideHeight ?? status?.nearestSensor?.tideHeight ?? point.tideHeight, 
                   unit: TIDE_UNIT, icon: Waves, color: 'text-chart-1', bg: 'bg-chart-1/10' 
                 },
                 { 
                   kind: 'rain',
                   label: rain.quantity, 
                   source: rain.source,
                   value: rain.value, 
                   unit: rain.unit, icon: CloudRain, color: 'text-chart-1', bg: 'bg-chart-1/10' 
                 },
                 { 
                   kind: 'other',
                   label: 'Dinâmica do vento', 
                   value: getMetricValue('windSpeed', status?.openMeteoData?.current?.wind_speed_10m),
                   unit: precise?.unitWindSpeed || 'km/h', icon: Wind, color: 'text-success', bg: 'bg-success/10' 
                 },
               ].map((item, idx) => (
                 <div key={idx} className="bg-muted p-6 rounded-2xl border border-border flex flex-col gap-4 hover:bg-muted transition-all group relative overflow-hidden">
                    <div className="flex items-center justify-between">
                       <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", item.bg)}>
                          <item.icon className={cn("h-5 w-5", item.color)} />
                       </div>
                       {item.kind === 'rain' && precise?.historicalAggregates && (
                         <div className="flex gap-1">
                            {[
                              { label: '3h', val: precise.historicalAggregates.rain3h },
                              { label: '6h', val: precise.historicalAggregates.rain6h },
                              { label: '12h', val: precise.historicalAggregates.rain12h }
                            ].map((agg, i) => agg.val != null && (
                              <div key={i} className="flex flex-col items-center">
                                 <span className="text-2xs text-muted-foreground font-bold">{agg.label}</span>
                                 <span className="text-2xs font-bold text-muted-foreground">{agg.val.toFixed(0)}</span>
                              </div>
                            ))}
                         </div>
                       )}
                       {item.kind !== 'rain' && <div className="h-1 w-8 rounded-full bg-muted" />}
                    </div>
                    <div>
                       <span className="text-2xs text-muted-foreground font-bold mb-1 block">{item.label}</span>
                       {item.kind === 'rain' && (
                         <span data-testid="rain-source" className="text-2xs text-foreground mb-1 block">Fonte: {item.source}</span>
                       )}
                       <p className="text-4xl font-bold text-foreground">
                         {formatValue(item.value, item.kind === 'tide' ? 2 : 1)}
                         <small className="text-xs font-bold text-muted-foreground ml-2 not-italic">{item.unit}</small>
                         {item.kind === 'tide' && <InfoHint label="Sobre a referência da maré" text={TIDE_NOTE} className="ml-1" />}
                       </p>
                    </div>
                    {/* Tiny decorative graph placeholder */}
                    <div className="flex items-end gap-1 h-4 mt-2">
                       {[0.3, 0.5, 0.8, 0.4, 0.9, 0.6, 0.2].map((h, i) => (
                         <div key={i} className={cn("flex-1 rounded-full", item.bg)} style={{ height: `${h * 100}%` }} />
                       ))}
                    </div>
                 </div>
               ))}
            </div>

            <TerrainFacts slug={point.slug} />

            {/* 3. Detailed infrastructure & Marine row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Marine & Tides (Left) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-4 px-2">
                   <div className="bg-chart-1/10 p-2 rounded-xl">
                      <Navigation className="h-4 w-4 text-chart-1" />
                   </div>
                   <h4 className="text-xs text-foreground font-bold">Dados marítimos & Tábuas</h4>
                </div>
                
                <div className="bg-muted p-8 rounded-2xl border border-border space-y-8 relative overflow-hidden group">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-2">
                      <p className="text-2xs text-muted-foreground font-bold">Previsto p/ Porto local</p>
                      <div className="flex items-baseline gap-3">
                         <p className="text-5xl font-bold text-foreground">
                           {formatValue(getMetricValue('tideHeightTabuaMare'), 2)}
                           <small className="text-sm ml-2 text-muted-foreground font-bold">{TIDE_UNIT}</small>
                           <InfoHint label="Sobre a referência da maré" text={TIDE_NOTE} className="ml-1" />
                         </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="bg-chart-1/10 px-3 py-1 rounded-lg border border-chart-1/40 inline-block">
                          <p className="text-2xs font-bold text-chart-1">API DevTu Node</p>
                       </div>
                    </div>
                  </div>

                  <div className="h-px w-full" />
                  
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                     <div className="bg-muted p-6 rounded-2xl border border-border hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                           <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
                           <p className="text-2xs text-muted-foreground font-bold">Pressão ATM</p>
                        </div>
                        <p className="text-xl font-bold text-foreground">
                          {formatValue(getMetricValue('pressure', status?.openMeteoData?.current?.surface_pressure), 0)}
                          <small className="text-2xs text-muted-foreground not-italic font-bold">HPA</small>
                        </p>
                     </div>
                     <div className="bg-muted p-6 rounded-2xl border border-border hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                           <Gauge className="h-3.5 w-3.5 text-chart-1" />
                           <p className="text-2xs text-muted-foreground font-bold">Vazão estimada</p>
                        </div>
                        <p className="text-xl font-bold text-chart-1">
                          {formatValue(getMetricValue('flowRate'), 2)} 
                          <small className="text-2xs text-muted-foreground not-italic font-bold">M³/S</small>
                        </p>
                     </div>
                  </div>
                  
                </div>
              </div>

              {/* Dynamic sensor infrastructure (Right) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-4">
                      <div className="bg-success/10 p-2 rounded-xl">
                         <Layers className="h-4 w-4 text-success" />
                      </div>
                      <h4 className="text-xs text-foreground font-bold">Infraestrutura de rede (3km)</h4>
                   </div>
                   <span className="text-2xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {Math.max(precise?.latestReadings?.length || 0, point.nearbySensorIds?.length || 0)} dispositivos detectados
                   </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {precise?.latestReadings && precise.latestReadings.length > 0 ? (
                      precise.latestReadings.slice(0, 4).map((sensor) => (
                        <div key={`${sensor.sensorId}-${sensor.type}`} className="bg-muted p-5 rounded-2xl border border-border flex items-center justify-between group hover:bg-muted transition-all">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                 {sensor.type.toLowerCase().includes('chuva') ? <CloudRain className="h-6 w-6" /> : <Waves className="h-6 w-6" />}
                              </div>
                              <div>
                                 <p className="text-2xs font-bold text-foreground truncate max-w-[120px]">{sensor.sensorId}</p>
                                 <p className="text-2xs font-bold text-muted-foreground mt-0.5">
                                    {sensor.type} • {sensor.distanceKm?.toFixed(2) ?? '--'}km • {getSafeFormattedDate(sensor.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-bold text-foreground">{sensor.value?.toFixed(1) ?? '--'}</p>
                              <p className="text-2xs font-bold text-muted-foreground leading-none">{sensor.unit}</p>
                           </div>
                        </div>
                      ))
                   ) : point.nearbySensorIds && point.nearbySensorIds.length > 0 ? (
                      point.nearbySensorIds.slice(0, 4).map((id) => (
                        <div key={id} className="bg-muted p-5 rounded-2xl border border-border flex items-center justify-between group hover:bg-muted transition-all">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                 <Zap className="h-6 w-6" />
                              </div>
                              <div>
                                 <p className="text-2xs font-bold text-foreground truncate max-w-[120px]">{id}</p>
                                 <p className="text-2xs font-bold text-muted-foreground mt-0.5">Aguardando telemetria em tempo real...</p>
                              </div>
                           </div>
                        </div>
                      ))
                   ) : (
                     /* Placeholder for No Sensors */
                     <div className="md:col-span-2 bg-muted border-2 border-dashed border-border rounded-2xl py-12 flex flex-col items-center justify-center gap-4 text-center opacity-40">
                        <Cpu className="h-10 w-10 text-muted-foreground" />
                        <div>
                           <p className="text-sm font-bold text-muted-foreground">Nenhum sensor de proximidade</p>
                           <p className="text-2xs text-muted-foreground font-bold mt-1">Utilizando dados regionais via Open-Meteo</p>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* 4. Action footer - Redesigned */}
            <div className="bg-muted p-10 rounded-2xl border border-border flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden">
               <div className="absolute inset-0 from-primary/10 pointer-events-none opacity-50" />
               
               <div className="flex items-center gap-8 relative z-10 w-full lg:w-auto">
                  <div className="h-20 w-20 rounded-2xl bg-muted border border-border flex items-center justify-center text-primary shadow-elevation-overlay shrink-0">
                     <MapPin className="h-10 w-10" />
                  </div>
                  <div>
                     <p className="text-2xs font-bold text-primary mb-2">Coordination point</p>
                     <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="bg-muted px-5 py-3 rounded-2xl border border-border">
                           <span className="text-sm font-bold text-muted-foreground font-mono">LAT: {point.latitude.toFixed(6)}</span>
                        </div>
                        <div className="bg-muted px-5 py-3 rounded-2xl border border-border">
                           <span className="text-sm font-bold text-muted-foreground font-mono">LNG: {point.longitude.toFixed(6)}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap gap-4 relative z-10 justify-center w-full lg:w-auto">
                  <Button 
                    variant="destructive" 
                    className="h-16 px-10 rounded-xl text-2xs font-bold shadow-elevation-overlay hover:scale-105 active:scale-95 transition-all duration-300"
                    onClick={onReportFlood}
                  >
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    Reportar incidente
                  </Button>
                  
                  <Button 
                    className="h-16 px-10 rounded-xl bg-muted hover:bg-muted text-foreground text-2xs font-bold transition-all duration-300 border border-border shadow-elevation-overlay"
                    onClick={onExportCsv}
                  >
                    <FileDown className="h-5 w-5 mr-3 text-primary" />
                    Exportar dados
                  </Button>

                  <Button 
                    variant="outline" 
                    className="h-16 px-10 rounded-xl border-border bg-muted text-2xs font-bold hover:bg-secondary transition-all duration-300 group"
                    onClick={onFocusMap}
                  >
                    <Navigation className="h-5 w-5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    Centralizar no ponto
                  </Button>
               </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </ModalDialog>
  );
};
