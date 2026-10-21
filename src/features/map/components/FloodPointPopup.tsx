import React from 'react';
import { 
  Maximize2,
  Clock,
  MapPin,
  Database,
  Activity,
  Loader2,
  Circle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';
import { getSafeFormattedDate } from '../utils/sensor';
import { getRiskVisual, formatProbability, showsExperimentalLabel } from '@/components/risk/risk';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { PredictionUnavailableNotice } from './PredictionUnavailableNotice';

interface FloodPointPopupProps {
  point: FloodPointResponseDTO;
  status?: PreciseDataResponse | null;
  isFetchingStatus?: boolean;
  onShowDetails: () => void;
}

export const FloodPointPopup: React.FC<FloodPointPopupProps> = ({ 
  point, 
  status,
  isFetchingStatus,
  onShowDetails 
}) => {
  const prediction = status?.floodPrediction;
  const precise = status?.preciseData;

  const visual = getRiskVisual(prediction?.riskLevel);
  const risk = { color: visual.bg, text: visual.text, label: visual.label, iconColor: visual.text, shadow: visual.shadow };
  const probability = formatProbability(prediction?.riskLevel, prediction?.floodProbability);
  const isUnknown = !visual.showsProbability;

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col bg-[#0c0c0e]/95 backdrop-blur-2xl text-white rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.7)] overflow-hidden w-[min(22.5rem,calc(100vw-2rem))] ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-500">
      {/* 1. Header with Risk Identity (fixo; só o corpo rola) */}
      <div className={cn(
        "shrink-0 px-6 py-5 border-b border-white/5 relative overflow-hidden transition-colors duration-700",
        visual.softBg
      )}>
        <div className="flex justify-between items-start relative z-10">
          <div className="flex gap-4">
             <div className={cn(
               "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-white/10 transition-all duration-700",
               visual.tint,
               risk.iconColor
             )}>
                <MapPin className="h-6 w-6" />
             </div>
             <div>
                <h3 className="text-base font-black leading-tight tracking-tight uppercase max-w-[180px] truncate">
                   {point.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      <span className="text-2xs font-mono font-black text-zinc-400 tracking-tighter uppercase">{point.slug}</span>
                   </div>
                   <span className="text-2xs font-bold text-zinc-400 uppercase tracking-widest leading-none">{point.municipality || 'Recife'}</span>
                </div>
             </div>
          </div>
          
          <div className="text-right flex flex-col items-end gap-1">
             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/5 shadow-sm">
                <Clock className="h-3 w-3 text-zinc-400" />
                <span className="text-2xs font-black text-zinc-400 uppercase tracking-tighter">
                   {precise?.timestamp ? getSafeFormattedDate(precise.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--' : '--:--'}
                </span>
             </div>
             {isFetchingStatus && <Loader2 className="h-3 w-3 text-primary animate-spin mt-1" />}
          </div>
        </div>
        {/* Dynamic Risk Background Glow */}
        <div className={cn("absolute -top-12 -right-12 w-32 h-32 blur-3xl opacity-20 transition-all duration-700 rounded-full", risk.color)} />
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
        {/* 2. Probability Hero Section */}
        <div className="bg-white/[0.03] rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
           <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-2xs text-zinc-400 font-black uppercase tracking-[0.3em]">Probabilidade IA</p>
                 {isUnknown ? (
                   <PredictionUnavailableNotice prediction={prediction} className="mt-1 space-y-0.5" />
                 ) : (
                   <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-6xl font-black italic tracking-tighter leading-none transition-colors duration-700",
                        risk.iconColor
                      )}>
                         {probability ?? '--'}
                      </span>
                   </div>
                 )}
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className={cn(
                   "px-3 py-2 rounded-xl text-2xs font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-700",
                   risk.color,
                   risk.shadow
                 )}>
                    <Circle className="h-2 w-2 fill-current" />
                    {risk.label}
                 </div>
                 <p className="text-2xs font-bold text-zinc-400 uppercase tracking-[0.1em]">Análise Preditiva</p>
              </div>
           </div>
           {showsExperimentalLabel(prediction) && <ExperimentalBadge className="relative z-10 mt-4" />}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
        </div>

        {/* 3. Nearby Sensors Context */}
        {(precise?.latestReadings && precise.latestReadings.length > 0) || (point.nearbySensorIds && point.nearbySensorIds.length > 0) ? (
          <div className="space-y-3">
             <div className="flex items-center justify-between px-1">
                <p className="text-2xs text-zinc-400 font-black uppercase tracking-[0.3em]">Rede de Sensores (3km)</p>
                <div className="h-px flex-1 mx-4 bg-white/5" />
                <span className="text-2xs text-primary font-black uppercase">
                  {precise?.latestReadings?.length || point.nearbySensorIds?.length || 0} Ativos
                </span>
             </div>
             <div className="grid grid-cols-1 gap-2">
                {precise?.latestReadings && precise.latestReadings.length > 0 ? (
                  precise.latestReadings.slice(0, 3).map((s) => (
                    <div key={`${s.sensorId}-${s.type}`} className="bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 flex items-center justify-between group/sensor">
                       <div className="flex items-center gap-3">
                          <Activity className="h-3 w-3 text-zinc-400 group-hover/sensor:text-primary transition-colors" />
                          <div>
                             <p className="text-2xs font-black text-zinc-300 uppercase leading-none">{s.sensorId}</p>
                             <p className="text-2xs font-bold text-zinc-400 uppercase mt-0.5 tracking-tighter">{s.type} • {s.distanceKm?.toFixed(1) ?? '--'}km</p>
                          </div>
                       </div>
                       <span className="text-2xs font-black text-white italic">{s.value?.toFixed(1) ?? '--'}<small className="ml-0.5 text-2xs opacity-40 not-italic uppercase">{s.unit}</small></span>
                    </div>
                  ))
                ) : (
                  point.nearbySensorIds?.slice(0, 3).map((id) => (
                    <div key={id} className="bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 flex items-center justify-between group/sensor">
                       <div className="flex items-center gap-3">
                          <Zap className="h-3 w-3 text-zinc-400" />
                          <div>
                             <p className="text-2xs font-black text-zinc-300 uppercase leading-none">{id}</p>
                             <p className="text-2xs font-bold text-zinc-400 uppercase mt-0.5 tracking-tighter">Aguardando telemetria...</p>
                          </div>
                       </div>
                    </div>
                  ))
                )}
                {((precise?.latestReadings?.length || 0) > 3 || (point.nearbySensorIds?.length || 0) > 3) && (
                  <p className="text-2xs text-center text-zinc-400 font-black uppercase py-1">
                    + {Math.max(precise?.latestReadings?.length || 0, point.nearbySensorIds?.length || 0) - 3} outros sensores na região
                  </p>
                )}
             </div>
          </div>
        ) : (
          <div className="bg-white/5 p-4 rounded-2xl border border-dashed border-white/10 flex items-center justify-center gap-3">
             <Zap className="h-4 w-4 text-zinc-400" />
             <span className="text-2xs font-black text-zinc-400 uppercase tracking-widest">Nenhum sensor direto no raio</span>
          </div>
        )}

        {/* 4. Insight Context */}
        {precise?.message && (
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-4 items-start relative group overflow-hidden">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-3.5 w-3.5 text-primary shrink-0" />
             </div>
             <p className="text-2xs text-zinc-400 italic leading-relaxed relative z-10 font-medium pr-2">
               {precise.message}
             </p>
          </div>
        )}

        {/* 5. Refined Action Button */}
        <div className="pt-2">
           <Button 
             onClick={onShowDetails}
             className="w-full h-12 text-2xs font-black uppercase tracking-[0.3em] bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all duration-500 rounded-2xl group relative overflow-hidden"
           >
             <span className="relative z-10 flex items-center justify-center gap-3">
                Painel Analítico Completo
                <Maximize2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
             </span>
             <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           </Button>
        </div>
      </div>
    </div>
  );
};
