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
  ArrowUpRight,
  Droplets,
  Layers,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSafeFormattedDate } from '../utils/sensor';
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

  const getRiskStyles = () => {
    const level = prediction?.riskLevel;
    if (level === 'CRITICAL') return { color: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/5', header: 'bg-red-600/80', label: 'Crítico' };
    if (level === 'HIGH') return { color: 'text-orange-500', border: 'border-orange-500/30', bg: 'bg-orange-500/5', header: 'bg-orange-600/80', label: 'Alto' };
    if (level === 'MEDIUM') return { color: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/5', header: 'bg-amber-600/80', label: 'Moderado' };
    return { color: 'text-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', header: 'bg-emerald-600/80', label: 'Baixo' };
  };

  const risk = getRiskStyles();

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <Card className="w-full max-w-6xl max-h-[95vh] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-white/10 bg-[#0c0c0e]/80 backdrop-blur-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col ring-1 ring-white/10 rounded-[3rem]">
        
        {/* Immersive Header */}
        <CardHeader className={cn(
          "pb-6 pt-8 px-8 flex flex-row items-center justify-between border-b border-white/5 relative overflow-hidden shrink-0 transition-colors duration-1000",
          risk.bg
        )}>
          <div className="flex items-center gap-6 text-white relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-white/10 ring-4 ring-black/20 transition-all duration-1000",
              risk.header
            )}>
              <ShieldAlert className="h-9 w-9 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-black tracking-tight uppercase italic leading-none">
                  {point.nome}
                </CardTitle>
                <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                  <span className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.2em]">Live node</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                 <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.1em] flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {point.municipio || 'Recife, PE'}
                 </p>
                 <div className="h-1 w-1 rounded-full bg-zinc-700" />
                 <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest font-mono">NODE_ID: {point.id_ponto}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
             <div className="text-right hidden md:block mr-2">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Sincronização</p>
                <p className="text-xs font-black text-emerald-500 uppercase flex items-center justify-end gap-1.5">
                   <Activity className="h-3 w-3 animate-pulse" /> Em tempo real
                   {precise?.timestamp && (
                     <span className="text-[9px] text-zinc-600 font-bold ml-2">
                       (Última: {getSafeFormattedDate(precise.timestamp)?.toLocaleTimeString('pt-BR') || '--:--'})
                     </span>
                   )}
                </p>
             </div>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all shadow-xl" 
               onClick={onClose}
             >
               <CloseIcon className="h-6 w-6" />
             </Button>
          </div>

          {/* Decorative Header background */}
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-50" />
        </CardHeader>

        <CardContent className="p-0 overflow-hidden flex flex-col bg-grid-white/[0.02]">
          <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            {/* 1. Main Analytical Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* IA Hero Card */}
              <div className={cn(
                "lg:col-span-8 p-10 rounded-[2.5rem] border shadow-2xl flex flex-col md:flex-row items-center justify-between group relative overflow-hidden transition-all duration-1000",
                risk.border,
                risk.bg
              )}>
                {isFetchingStatus && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative h-12 w-12">
                         <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                         <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Deep Analysis...</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-8 relative z-10 flex-1">
                  <div className="flex items-center gap-3">
                     <div className="bg-primary/20 p-2 rounded-xl">
                        <Cpu className="h-4 w-4 text-primary" />
                     </div>
                     <p className="text-[11px] text-zinc-500 uppercase font-black tracking-[0.4em]">Predição Estocástica (MAPI-IA)</p>
                  </div>

                  <div className="flex items-baseline gap-6">
                    <span className={cn(
                      "text-[9rem] font-black tracking-tighter italic leading-none transition-colors duration-1000",
                      risk.color
                    )}>
                      {prediction?.floodProbability != null ? `${(prediction.floodProbability * 100).toFixed(0)}%` : '--'}
                    </span>
                    <div className="flex flex-col gap-1">
                       <span className="text-xl font-black text-zinc-300 uppercase tracking-tighter leading-none italic">Probabilidade</span>
                       <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest mt-2 border-l-2 border-primary pl-3">Neural Engine v2.4</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className={cn(
                      "px-6 py-3 rounded-2xl border flex items-center gap-4 transition-all duration-700 shadow-lg",
                      risk.border,
                      risk.header,
                      prediction?.riskLevel === 'CRITICAL' && "animate-pulse"
                    )}>
                      <AlertTriangle className="h-6 w-6 text-white" />
                      <div>
                         <p className="text-[9px] text-white/60 font-black uppercase tracking-widest leading-none mb-1">Nível de Risco</p>
                         <p className="text-lg font-black text-white uppercase tracking-tighter leading-none">{risk.label}</p>
                      </div>
                    </div>
                    
                    {prediction?.estimatedTimeToEvent && (
                      <div className="px-6 py-3 rounded-2xl border border-white/5 bg-black/40 flex items-center gap-4 shadow-lg">
                        <div className="bg-zinc-800 p-2 rounded-xl">
                           <History className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div>
                           <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Impacto Previsto</p>
                           <p className="text-base font-black text-zinc-200 uppercase tracking-tighter leading-none">{prediction.estimatedTimeToEvent}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn(
                  "mt-8 md:mt-0 h-48 w-48 rounded-[3.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-6",
                  prediction?.riskLevel === 'CRITICAL' ? "bg-red-500" : "bg-[#16161a] border border-white/10"
                )}>
                  <Zap className={cn("h-24 w-24 transition-colors duration-1000", prediction?.riskLevel === 'CRITICAL' ? "text-white" : "text-primary")} />
                  {/* Decorative internal rings */}
                  <div className="absolute inset-4 border border-white/5 rounded-[2.5rem]" />
                  <div className="absolute inset-8 border border-white/5 rounded-[2rem] opacity-50" />
                </div>
              </div>

              {/* Recommendation Side Card */}
              <div className="lg:col-span-4 bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.03] transition-transform duration-1000 group-hover:scale-125">
                    <Database className="h-40 w-40" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-8">
                       <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-[11px] text-zinc-400 uppercase font-black tracking-[0.3em]">IA Insights</p>
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-primary transition-colors">
                          <ArrowUpRight className="h-4 w-4" />
                       </Button>
                    </div>
                    <p className="text-base text-zinc-300 leading-relaxed italic font-medium">
                      "{prediction?.message || 'Coletando telemetria ambiental para processar recomendação automatizada via redes neurais...'}"
                    </p>
                 </div>
                 <div className="pt-10 border-t border-white/5 flex justify-between items-center relative z-10">
                    <div>
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Fonte</p>
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter italic">Processamento Edge</p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                       <div className={cn(
                         "h-2 w-2 rounded-full",
                         point.active ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-zinc-600"
                       )} />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">{point.active ? 'Ativo' : 'Offline'}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* 2. Environmental Grid - High Density */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { 
                   label: 'Telemetria Térmica', 
                   value: getMetricValue('temperature', status?.openMeteoData?.current?.temperature_2m), 
                   unit: precise?.unitTemperature || '°C', icon: Thermometer, color: 'text-orange-400', bg: 'bg-orange-500/10' 
                 },
                 { 
                   label: 'Status da Maré', 
                   value: precise?.tideHeight ?? status?.nearestSensor?.tideHeight ?? point.tideHeight, 
                   unit: precise?.unitTide || 'm', icon: Waves, color: 'text-blue-400', bg: 'bg-blue-500/10' 
                 },
                 { 
                   label: 'Acumulado Chuva (24h)', 
                   value: precise?.historicalAggregates?.rain24h ?? getMetricValue('precipitation', status?.openMeteoData?.current?.precipitation), 
                   unit: precise?.unitPrecipitation || 'mm', icon: CloudRain, color: 'text-sky-400', bg: 'bg-sky-500/10' 
                 },
                 { 
                   label: 'Dinâmica do Vento', 
                   value: getMetricValue('windSpeed', (status?.openMeteoData?.current as any)?.wind_speed_10m), 
                   unit: precise?.unitWindSpeed || 'km/h', icon: Wind, color: 'text-emerald-400', bg: 'bg-emerald-500/10' 
                 },
               ].map((item, idx) => (
                 <div key={idx} className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex flex-col gap-4 hover:bg-white/[0.06] transition-all group relative overflow-hidden">
                    <div className="flex items-center justify-between">
                       <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", item.bg)}>
                          <item.icon className={cn("h-5 w-5", item.color)} />
                       </div>
                       {item.label.includes('Chuva') && precise?.historicalAggregates && (
                         <div className="flex gap-1">
                            {[
                              { label: '3h', val: precise.historicalAggregates.rain3h },
                              { label: '6h', val: precise.historicalAggregates.rain6h },
                              { label: '12h', val: precise.historicalAggregates.rain12h }
                            ].map((agg, i) => agg.val != null && (
                              <div key={i} className="flex flex-col items-center">
                                 <span className="text-[7px] text-zinc-600 font-bold uppercase">{agg.label}</span>
                                 <span className="text-[9px] font-black text-zinc-400">{agg.val.toFixed(0)}</span>
                              </div>
                            ))}
                         </div>
                       )}
                       {!item.label.includes('Chuva') && <div className="h-1 w-8 rounded-full bg-white/5" />}
                    </div>
                    <div>
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1 block opacity-60">{item.label}</span>
                       <p className="text-4xl font-black text-white italic tracking-tighter">
                         {formatValue(item.value, item.label.includes('Maré') ? 2 : 1)}
                         <small className="text-xs font-bold text-zinc-600 ml-2 not-italic uppercase tracking-widest">{item.unit}</small>
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

            {/* 3. Detailed Infrastructure & Marine Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Marine & Tides (Left) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-4 px-2">
                   <div className="bg-blue-500/20 p-2 rounded-xl">
                      <Navigation className="h-4 w-4 text-blue-400" />
                   </div>
                   <h4 className="text-[12px] text-zinc-300 uppercase font-black tracking-[0.3em]">Dados Marítimos & Tábuas</h4>
                </div>
                
                <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden group">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-2">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] opacity-60">Previsto p/ Porto Local</p>
                      <div className="flex items-baseline gap-3">
                         <p className="text-5xl font-black text-white italic tracking-tighter">
                           {formatValue(getMetricValue('tideHeightTabuaMare'), 2)}
                           <small className="text-sm ml-2 text-zinc-600 uppercase italic font-bold">meters</small>
                         </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 inline-block">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">API DevTu Node</p>
                       </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="grid grid-cols-2 gap-6 relative z-10">
                     <div className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                           <Droplets className="h-3.5 w-3.5 text-zinc-500" />
                           <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Pressão ATM</p>
                        </div>
                        <p className="text-xl font-black text-zinc-300 italic">
                          {formatValue(getMetricValue('pressure', (status?.openMeteoData?.current as any)?.surface_pressure), 0)} 
                          <small className="text-[11px] text-zinc-600 opacity-60 not-italic font-bold">HPA</small>
                        </p>
                     </div>
                     <div className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                           <Gauge className="h-3.5 w-3.5 text-indigo-500" />
                           <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Vazão Estimada</p>
                        </div>
                        <p className="text-xl font-black text-indigo-400 italic">
                          {formatValue(getMetricValue('flowRate'), 2)} 
                          <small className="text-[11px] text-zinc-600 opacity-60 not-italic font-bold">M³/S</small>
                        </p>
                     </div>
                  </div>
                  
                  <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-blue-500/5 blur-3xl rounded-full" />
                </div>
              </div>

              {/* Dynamic Sensor Infrastructure (Right) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/20 p-2 rounded-xl">
                         <Layers className="h-4 w-4 text-emerald-400" />
                      </div>
                      <h4 className="text-[12px] text-zinc-300 uppercase font-black tracking-[0.3em]">Infraestrutura de Rede (3km)</h4>
                   </div>
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                      {Math.max(precise?.latestReadings?.length || 0, point.sensores_proximos_ids?.length || 0)} dispositivos detectados
                   </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {precise?.latestReadings && precise.latestReadings.length > 0 ? (
                      precise.latestReadings.slice(0, 4).map((sensor) => (
                        <div key={`${sensor.sensorId}-${sensor.type}`} className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                                 {sensor.type.toLowerCase().includes('chuva') ? <CloudRain className="h-6 w-6" /> : <Waves className="h-6 w-6" />}
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[120px]">{sensor.sensorId}</p>
                                 <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5 tracking-tighter">
                                    {sensor.type} • {sensor.distanceKm?.toFixed(2) ?? '--'}km • {getSafeFormattedDate(sensor.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-black text-white italic">{sensor.value?.toFixed(1) ?? '--'}</p>
                              <p className="text-[9px] font-bold text-zinc-700 uppercase leading-none">{sensor.unit}</p>
                           </div>
                        </div>
                      ))
                   ) : point.sensores_proximos_ids && point.sensores_proximos_ids.length > 0 ? (
                      point.sensores_proximos_ids.slice(0, 4).map((id) => (
                        <div key={id} className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-primary transition-colors">
                                 <Zap className="h-6 w-6" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[120px]">{id}</p>
                                 <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5 tracking-tighter">Aguardando telemetria em tempo real...</p>
                              </div>
                           </div>
                        </div>
                      ))
                   ) : (
                     /* Placeholder for No Sensors */
                     <div className="md:col-span-2 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[2.5rem] py-12 flex flex-col items-center justify-center gap-4 text-center opacity-40">
                        <Cpu className="h-10 w-10 text-zinc-700" />
                        <div>
                           <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Nenhum sensor de proximidade</p>
                           <p className="text-[10px] text-zinc-700 font-bold uppercase mt-1">Utilizando dados regionais via Open-Meteo</p>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* 4. Action Footer - Redesigned */}
            <div className="bg-black/60 p-10 rounded-[3rem] border border-white/5 flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none opacity-50" />
               
               <div className="flex items-center gap-8 relative z-10 w-full lg:w-auto">
                  <div className="h-20 w-20 rounded-[2rem] bg-zinc-900 border border-white/5 flex items-center justify-center text-primary shadow-[0_20px_40px_rgba(0,0,0,0.5)] shrink-0">
                     <MapPin className="h-10 w-10" />
                  </div>
                  <div>
                     <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-2">Coordination point</p>
                     <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="bg-black/40 px-5 py-3 rounded-2xl border border-white/5">
                           <span className="text-sm font-black text-zinc-400 font-mono tracking-tighter">LAT: {point.latitude.toFixed(6)}</span>
                        </div>
                        <div className="bg-black/40 px-5 py-3 rounded-2xl border border-white/5">
                           <span className="text-sm font-black text-zinc-400 font-mono tracking-tighter">LNG: {point.longitude.toFixed(6)}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap gap-4 relative z-10 justify-center w-full lg:w-auto">
                  <Button 
                    variant="destructive" 
                    className="h-16 px-10 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-red-950/40 hover:scale-105 active:scale-95 transition-all duration-300"
                    onClick={onReportFlood}
                  >
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    Reportar Incidente
                  </Button>
                  
                  <Button 
                    className="h-16 px-10 rounded-[1.5rem] bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 border border-white/10 shadow-2xl"
                    onClick={onExportCsv}
                  >
                    <FileDown className="h-5 w-5 mr-3 text-primary" />
                    Extract Dataset
                  </Button>

                  <Button 
                    variant="outline" 
                    className="h-16 px-10 rounded-[1.5rem] border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-300 group"
                    onClick={onFocusMap}
                  >
                    <Navigation className="h-5 w-5 mr-3 text-zinc-500 group-hover:text-primary transition-colors" />
                    Focus Grid
                  </Button>
               </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};
