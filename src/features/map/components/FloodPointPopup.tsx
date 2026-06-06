import React from 'react';
import { 
  Waves, 
  CloudRain, 
  ExternalLink,
  Clock,
  MapPin,
  ShieldAlert,
  Database,
  Wind,
  Activity,
  Loader2,
  Cpu,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';

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

  const getRiskStyles = () => {
    const level = prediction?.riskLevel;
    if (level === 'CRITICAL') return { color: 'bg-red-500', text: 'text-red-400', label: 'Crítico', iconColor: 'text-red-500' };
    if (level === 'HIGH') return { color: 'bg-orange-500', text: 'text-orange-400', label: 'Alto', iconColor: 'text-orange-500' };
    if (level === 'MEDIUM') return { color: 'bg-amber-500', text: 'text-amber-400', label: 'Moderado', iconColor: 'text-amber-500' };
    if (level === 'LOW') return { color: 'bg-emerald-500', text: 'text-emerald-400', label: 'Baixo', iconColor: 'text-emerald-500' };
    return { color: 'bg-zinc-700', text: 'text-zinc-400', label: 'Em Análise', iconColor: 'text-zinc-500' };
  };

  const getRiskText = () => {
    const level = prediction?.riskLevel;
    if (level === 'CRITICAL') return 'Risco Crítico';
    if (level === 'HIGH') return 'Risco Elevado';
    if (level === 'MEDIUM') return 'Risco Moderado';
    if (level === 'LOW') return 'Risco Baixo';
    return 'Em Análise';
  };

  const formatValue = (val: number | null | undefined, decimals: number) => {
    if (val != null && typeof val === 'number') return val.toFixed(decimals);
    return '--';
  };

  const risk = getRiskStyles();

  return (
    <div className="bg-[#0c0c0e]/95 backdrop-blur-2xl text-white rounded-[2.5rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.7)] overflow-hidden w-[340px] ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-500">
      {/* 1. Dynamic Header */}
      <div className="px-6 py-5 bg-white/[0.02] border-b border-white/5 relative overflow-hidden">
        <div className="flex justify-between items-start relative z-10">
          <div className="flex gap-4">
             <div className={cn(
               "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-white/10",
               risk.color.replace('bg-', 'bg-').concat('/10'),
               risk.iconColor
             )}>
                <MapPin className="h-6 w-6" />
             </div>
             <div>
                <h3 className="text-base font-black leading-tight tracking-tight uppercase max-w-[160px] truncate">
                   {point.nome}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      <span className="text-[8px] font-mono font-black text-zinc-500 tracking-tighter uppercase">{point.id_ponto}</span>
                   </div>
                   <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{point.municipio || 'Recife'}</span>
                </div>
             </div>
          </div>
          
          <div className="text-right flex flex-col items-end gap-1">
             <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-white/5">
                <Clock className="h-3 w-3 text-zinc-500" />
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">
                   {precise?.timestamp ? new Date(precise.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
             </div>
             {isFetchingStatus && <Loader2 className="h-3 w-3 text-primary animate-spin mt-1" />}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 2. Probability Hero Section */}
        <div className="bg-white/[0.03] rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
           <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em]">Probabilidade IA</p>
                 <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-6xl font-black italic tracking-tighter leading-none transition-colors duration-500",
                      risk.iconColor
                    )}>
                       {prediction?.floodProbability != null ? `${(prediction.floodProbability * 100).toFixed(0)}%` : '--'}
                    </span>
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className={cn(
                   "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2",
                   risk.color,
                   prediction?.riskLevel === 'CRITICAL' && "animate-pulse"
                 )}>
                    <Circle className="h-2 w-2 fill-current" />
                    {getRiskText()}
                 </div>
                 <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Predição em Tempo Real</p>
              </div>
           </div>
           {/* Visual background noise */}
           <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
        </div>

        {/* 3. Metrics Grid (Uniform, Color Coded) */}
        <div className="grid grid-cols-2 gap-3 relative">
          {isFetchingStatus && (
            <div className="absolute inset-0 z-20 bg-[#0c0c0e]/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border border-primary/20">
               <div className="flex flex-col items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary animate-bounce" />
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Processando...</span>
               </div>
            </div>
          )}
          
          <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <CloudRain className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 font-black uppercase block tracking-tighter opacity-70">Chuva</span>
              <span className="text-sm font-black text-white">
                {formatValue(precise?.precipitation, 1)}
                <small className="ml-0.5 text-[10px] opacity-40 uppercase font-bold">{precise?.unitPrecipitation || 'mm'}</small>
              </span>
            </div>
          </div>
          
          <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all">
            <div className="p-2 bg-blue-600/10 rounded-xl">
              <Waves className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 font-black uppercase block tracking-tighter opacity-70">Maré</span>
              <span className="text-sm font-black text-blue-400">
                {formatValue(precise?.tideHeight ?? point.tideHeight, 2)}
                <small className="ml-0.5 text-[10px] opacity-40 uppercase font-bold">{precise?.unitTide || 'm'}</small>
              </span>
            </div>
          </div>

          <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all">
            <div className="p-2 bg-teal-500/10 rounded-xl">
              <Wind className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 font-black uppercase block tracking-tighter opacity-70">Vento</span>
              <span className="text-sm font-black text-white">
                {formatValue(precise?.windSpeed, 1)}
                <small className="ml-0.5 text-[10px] opacity-40 uppercase font-bold">{precise?.unitWindSpeed || 'km/h'}</small>
              </span>
            </div>
          </div>

          <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-right">
              <span className="text-[9px] text-zinc-500 font-black uppercase block tracking-tighter opacity-70">Pressão</span>
              <span className="text-sm font-black text-white">
                {formatValue(precise?.pressure, 0)}
                <small className="ml-0.5 text-[10px] opacity-40 uppercase font-bold">{precise?.unitPressure || 'hPa'}</small>
              </span>
            </div>
          </div>
        </div>

        {/* 4. IA Insights Section */}
        {precise?.message && (
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-4 items-start relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-5 transition-transform group-hover:scale-125">
                <Database className="h-10 w-10 text-primary" />
             </div>
             <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-4 w-4 text-primary shrink-0" />
             </div>
             <p className="text-[10px] text-zinc-400 italic leading-relaxed relative z-10 font-medium pr-4">
               {precise.message}
             </p>
          </div>
        )}

        {/* 5. Refined Action Button */}
        <div className="pt-2">
           <Button 
             onClick={onShowDetails}
             className="w-full h-12 text-[10px] font-black uppercase tracking-[0.3em] bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary transition-all duration-500 rounded-2xl group relative overflow-hidden"
           >
             <span className="relative z-10 flex items-center justify-center gap-3">
                Análise de Risco Completa
                <ExternalLink className="h-4 w-4 opacity-50 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </span>
             <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           </Button>
        </div>
      </div>
    </div>
  );
};
