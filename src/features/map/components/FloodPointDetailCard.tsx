import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
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
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';

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

  const formatValue = (val: number | null | undefined, decimals: number) => {
    if (val != null && typeof val === 'number') return val.toFixed(decimals);
    return '--';
  };

  const getRiskColor = () => {
    const level = prediction?.riskLevel;
    if (level === 'CRITICAL') return 'text-red-500 border-red-500/30 bg-red-950/20';
    if (level === 'HIGH') return 'text-orange-500 border-orange-500/30 bg-orange-950/20';
    if (level === 'MEDIUM') return 'text-amber-500 border-amber-500/30 bg-amber-950/20';
    return 'text-emerald-500 border-emerald-500/30 bg-emerald-950/20';
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <Card className="w-full max-w-5xl max-h-[90vh] shadow-2xl border-white/10 bg-zinc-950/60 backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-white/5">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-white/5 bg-white/5 shrink-0">
          <div className="flex items-center gap-4 text-white">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/10",
              prediction?.riskLevel === 'CRITICAL' ? "bg-red-600/80" : "bg-primary/80"
            )}>
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight uppercase">
                  {point.nome}
                </CardTitle>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-bold uppercase border border-white/5 tracking-widest">
                  Ponto de Monitoramento
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {point.municipio || 'Localidade não informada'} • ID: {point.id_ponto}
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
            {/* Primary Analysis - IA Prediction */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={cn(
                "lg:col-span-2 p-8 rounded-3xl border shadow-2xl flex items-center justify-between group relative overflow-hidden transition-all duration-500",
                getRiskColor().split(' ')[1] + " " + getRiskColor().split(' ')[2]
              )}>
                {isFetchingStatus && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Sincronizando...</span>
                    </div>
                  </div>
                )}
                
                {/* Decorative Background Icon */}
                <ShieldAlert className="absolute -right-8 -bottom-8 h-48 w-48 opacity-[0.03] rotate-12 pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em]">Probabilidade de Inundação (IA)</p>
                  <div className="flex items-baseline gap-3">
                    <span className={cn(
                      "text-7xl font-black tracking-tighter italic",
                      getRiskColor().split(' ')[0]
                    )}>
                      {prediction?.floodProbability != null ? `${(prediction.floodProbability * 100).toFixed(0)}%` : '--'}
                    </span>
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-zinc-400 uppercase tracking-widest leading-none">Confiança</span>
                       <span className="text-[10px] font-bold text-zinc-600 uppercase mt-1">Modelo v1.2</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className={cn(
                      "px-3 py-1.5 rounded-xl border flex items-center gap-3 w-fit transition-transform group-hover:scale-105 duration-500",
                      getRiskColor().split(' ')[1] + " " + getRiskColor().split(' ')[2]
                    )}>
                      <AlertTriangle className={cn("h-4 w-4", prediction?.riskLevel === 'CRITICAL' && "animate-bounce")} />
                      <span className="text-xs font-black uppercase tracking-widest">Status: {prediction?.riskLevel || 'Analisando...'}</span>
                    </div>
                    {prediction?.estimatedTimeToEvent && (
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Previsão: {prediction.estimatedTimeToEvent}
                      </p>
                    )}
                  </div>
                </div>

                <div className={cn(
                  "h-32 w-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 transition-transform group-hover:rotate-6 duration-700",
                  prediction?.riskLevel === 'CRITICAL' ? "bg-red-500 shadow-red-500/20" : "bg-zinc-800 shadow-black/40"
                )}>
                  <Zap className="h-16 w-16 text-white" />
                </div>
              </div>

              <div className="bg-white/5 p-8 rounded-3xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Clock className="h-24 w-24" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                       <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Recomendação</p>
                       <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed italic font-medium">
                      "{prediction?.message || 'Aguardando processamento dos dados meteorológicos e de maré para gerar predição em tempo real.'}"
                    </p>
                 </div>
                 <div className="pt-8 border-t border-white/5 flex justify-between items-center relative z-10">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status Sensor</span>
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "h-2 w-2 rounded-full",
                         point.active ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                       )} />
                       <span className="text-[10px] font-black text-white uppercase">{point.active ? 'Ativo' : 'Offline'}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Environmental Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { label: 'Temperatura', value: precise?.temperature, unit: precise?.unitTemperature || '°C', icon: Thermometer, color: 'text-orange-400' },
                 { label: 'Maré Atual', value: precise?.tideHeight ?? point.tideHeight, unit: precise?.unitTide || 'm', icon: Waves, color: 'text-blue-400' },
                 { label: 'Chuva', value: precise?.precipitation, unit: precise?.unitPrecipitation || 'mm', icon: CloudRain, color: 'text-sky-400' },
                 { label: 'Vento', value: precise?.windSpeed, unit: precise?.unitWindSpeed || 'km/h', icon: Wind, color: 'text-emerald-400' },
               ].map((item, idx) => (
                 <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col gap-3 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 rounded-lg bg-white/5 group-hover:scale-110 transition-transform">
                          <item.icon className={cn("h-4 w-4", item.color)} />
                       </div>
                       <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className="text-3xl font-black text-white italic">
                      {formatValue(item.value, item.label.includes('Maré') ? 2 : 1)}
                      <small className="text-xs font-bold text-zinc-600 ml-1 not-italic uppercase">{item.unit}</small>
                    </p>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em] flex items-center gap-2 border-b border-white/5 pb-2">
                  <Navigation className="h-4 w-4 text-primary" /> Tábuas & Portos
                </h4>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Nível Tábua (Previsto)</p>
                      <p className="text-2xl font-black text-white italic mt-1">
                        {formatValue(precise?.tideHeightTabuaMare, 2)}
                        <small className="text-xs ml-1 opacity-40 uppercase">{precise?.unitTide || 'm'}</small>
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Fonte de Dados</p>
                       <p className="text-[10px] font-black text-zinc-400 mt-1 uppercase tracking-tighter italic">DevTu / Porto Local</p>
                    </div>
                  </div>
                  <div className="h-px w-full bg-white/5" />
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Pressão</p>
                        <p className="text-sm font-black text-zinc-300">{formatValue(precise?.pressure, 0)} <small className="text-[10px] opacity-40">{precise?.unitPressure || 'hPa'}</small></p>
                     </div>
                     <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Vazão (Est.)</p>
                        <p className="text-sm font-black text-indigo-400">{formatValue(precise?.flowRate, 2)} <small className="text-[10px] opacity-40">{precise?.unitFlowRate || 'm³/s'}</small></p>
                     </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em] flex items-center gap-2 border-b border-white/5 pb-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> Infraestrutura
                </h4>
                <div className="grid grid-cols-1 gap-3">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <CloudRain className="h-5 w-5" />
                         </div>
                         <div>
                            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Sensor Pluviométrico</p>
                            <p className="text-xs font-mono font-black text-zinc-300 mt-0.5">
                              {point.config_sensores?.estacao_pluviometrica_id || 'Não configurado'}
                            </p>
                         </div>
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity"><Zap className="h-4 w-4" /></Button>
                   </div>
                   
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <Waves className="h-5 w-5" />
                         </div>
                         <div>
                            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Sensor Nível do Rio</p>
                            <p className="text-xs font-mono font-black text-zinc-300 mt-0.5">
                              {point.config_sensores?.estacao_nivel_rio_id || 'Não configurado'}
                            </p>
                         </div>
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity"><Zap className="h-4 w-4" /></Button>
                   </div>
                </div>
              </div>
            </div>

            {/* Geolocation & Actions */}
            <div className="bg-black/60 p-8 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
               <div className="flex items-center gap-6 relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center text-primary shadow-2xl">
                     <MapPin className="h-8 w-8" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Coordenadas Geográficas</p>
                     <p className="text-xl text-zinc-400 font-mono mt-1 font-bold">
                       {point.latitude.toFixed(6)} <span className="text-zinc-700 mx-2">|</span> {point.longitude.toFixed(6)}
                     </p>
                  </div>
               </div>
               <div className="flex flex-wrap gap-3 relative z-10 justify-center">
                  <Button 
                    variant="destructive" 
                    className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-950/40 hover:scale-105 transition-all"
                    onClick={onReportFlood}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reportar Evento
                  </Button>
                  <Button 
                    className="h-12 px-8 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
                    onClick={onExportCsv}
                  >
                    <FileDown className="h-4 w-4 mr-2 text-primary" />
                    Dataset IA
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 px-8 rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                    onClick={onFocusMap}
                  >
                    Focar Mapa
                  </Button>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
