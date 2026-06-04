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
  Info,
  Activity,
  FileDown
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
  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl max-h-[90vh] shadow-2xl border-white/10 bg-zinc-950/60 backdrop-blur-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-white/5">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-white/5 bg-white/5 shrink-0">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl border border-white/10 bg-red-600/80">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold tracking-tight">
                  {point.nome}
                </CardTitle>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-bold uppercase border border-white/5">
                  Ponto de Risco
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
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
            {/* Primary Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={cn(
                "md:col-span-2 p-6 rounded-2xl border shadow-xl flex items-center justify-between group relative overflow-hidden transition-colors duration-500",
                status?.floodPrediction?.riskLevel === 'CRITICAL' ? "bg-red-950/40 border-red-500/30" :
                status?.floodPrediction?.riskLevel === 'HIGH' ? "bg-orange-950/30 border-orange-500/20" :
                "bg-white/5 border-white/5"
              )}>
                {isFetchingStatus && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Atualizando Dados...</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase font-bold tracking-[0.2em]">Risco de Alagamento (IA)</p>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-6xl font-black tracking-tighter",
                      status?.floodPrediction?.riskLevel === 'CRITICAL' ? "text-red-500" :
                      status?.floodPrediction?.riskLevel === 'HIGH' ? "text-orange-500" : "text-white"
                    )}>
                      {status?.floodPrediction ? `${(status.floodPrediction.floodProbability * 100).toFixed(0)}%` : '--'}
                    </span>
                    <span className="text-xl font-bold text-zinc-600 uppercase">
                      Probabilidade
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pt-2">
                    <p className={cn(
                      "text-xs font-bold flex items-center gap-2",
                      status?.floodPrediction?.riskLevel === 'CRITICAL' ? "text-red-400" :
                      status?.floodPrediction?.riskLevel === 'HIGH' ? "text-orange-400" : "text-emerald-400"
                    )}>
                      <AlertTriangle className={cn("h-3.5 w-3.5", status?.floodPrediction?.riskLevel === 'CRITICAL' && "animate-pulse")} />
                      Nível de Risco: {status?.floodPrediction?.riskLevel || 'Analisando...'}
                    </p>
                    {status?.floodPrediction?.estimatedTimeToEvent && (
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Estimativa: {status.floodPrediction.estimatedTimeToEvent}
                      </p>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "h-24 w-24 rounded-3xl flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity",
                  status?.floodPrediction?.riskLevel === 'CRITICAL' ? "bg-red-500" : "bg-primary"
                )}>
                  <Zap className="h-16 w-16 text-white" />
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Mensagem da IA</p>
                    <div className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">
                       MAPI AI v1
                    </div>
                 </div>
                 <div className="pt-4">
                    <p className="text-[11px] text-zinc-300 leading-relaxed italic">
                      "{status?.floodPrediction?.message || 'Aguardando processamento dos dados meteorológicos e de maré para gerar predição.'}"
                    </p>
                 </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Maré Atual</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{status?.preciseData.tideHeight ?? point.tideHeight ?? '--'}</span>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase">{status?.preciseData.unitTide ?? point.tideUnit ?? 'm'}</span>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Precipitação</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{status?.preciseData.precipitation ?? '--'}</span>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase">mm</span>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Status Sensor</span>
                <div className="flex items-center gap-2">
                   <div className={cn(
                     "h-2 w-2 rounded-full animate-pulse",
                     point.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                   )} />
                   <span className="text-xs font-bold text-white uppercase">{point.active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>

            {/* Marine & Tide Grid */}
            {status && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                    <Waves className="h-4 w-4 text-blue-400" /> Condições Marítimas
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Altura das Ondas</p>
                      <p className="text-lg font-black text-white">{status.preciseData.waveHeight ?? '--'} m</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Período</p>
                      <p className="text-lg font-black text-white">{status.preciseData.wavePeriod ?? '--'} s</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                    <Clock className="h-4 w-4 text-emerald-400" /> Tábuas de Maré (Previsto)
                  </h4>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                     <div>
                       <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Referência Tábua</p>
                       <p className="text-lg font-black text-emerald-500 mt-1">
                         {status.preciseData.tideHeightTabuaMare ?? '--'} m
                       </p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Fonte</p>
                        <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">DevTu / Porto</p>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                  <Info className="h-4 w-4 text-primary" /> Características do Local
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Distância do Canal</p>
                    <p className="text-lg font-black text-white">{point.dist_canal_m !== null ? `${point.dist_canal_m} m` : 'N/A'}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Bacia Hidrográfica</p>
                    <p className="text-sm font-bold text-white truncate">{point.bacia_hidrografica || 'Não informada'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> Sensores Vinculados
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                     <div>
                       <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Estação Pluviométrica</p>
                       <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
                         {point.config_sensores?.estacao_pluviometrica_id || 'Nenhum sensor configurado'}
                       </p>
                     </div>
                     <CloudRain className="h-4 w-4 text-zinc-700" />
                  </div>
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                     <div>
                       <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Estação Nível do Rio</p>
                       <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
                         {point.config_sensores?.estacao_nivel_rio_id || 'Nenhum sensor configurado'}
                       </p>
                     </div>
                     <Waves className="h-4 w-4 text-zinc-700" />
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
                       {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                     </p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="text-[10px] font-bold uppercase tracking-widest h-10 px-6 gap-2 rounded-xl transition-all shadow-lg shadow-red-900/20"
                    onClick={onReportFlood}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Reportar Alagamento
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest h-10 px-6 gap-2 rounded-xl transition-all"
                    onClick={onExportCsv}
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar IA
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-transparent border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest h-10 px-6 rounded-xl transition-all"
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
