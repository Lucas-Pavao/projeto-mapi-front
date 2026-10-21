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
    <div className="flex max-h-[calc(100vh-8rem)] flex-col bg-popover text-foreground rounded-2xl border border-border shadow-elevation-overlay overflow-hidden w-[min(22.5rem,calc(100vw-2rem))] ring-1 ring-border animate-in fade-in zoom-in-95 duration-500">
      {/* 1. Header with Risk identity (fixo; só o corpo rola) */}
      <div className={cn(
        "shrink-0 px-6 py-5 border-b border-border relative overflow-hidden transition-colors duration-700",
        visual.softBg
      )}>
        <div className="flex justify-between items-start relative z-10">
          <div className="flex gap-4">
             <div className={cn(
               "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ring-1 ring-border transition-all duration-700",
               visual.tint,
               risk.iconColor
             )}>
                <MapPin className="h-6 w-6" />
             </div>
             <div>
                <h3 className="text-base font-bold leading-tight max-w-[180px] truncate">
                   {point.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="bg-muted px-2 py-0.5 rounded-md border border-border">
                      <span className="text-2xs font-mono font-bold text-muted-foreground">{point.slug}</span>
                   </div>
                   <span className="text-2xs font-bold text-muted-foreground leading-none">{point.municipality || 'Recife'}</span>
                </div>
             </div>
          </div>
          
          <div className="text-right flex flex-col items-end gap-1">
             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border shadow-sm">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-2xs font-bold text-muted-foreground">
                   {precise?.timestamp ? getSafeFormattedDate(precise.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '--:--' : '--:--'}
                </span>
             </div>
             {isFetchingStatus && <Loader2 className="h-3 w-3 text-primary animate-spin mt-1" />}
          </div>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
        {/* 2. Probability hero section */}
        <div className="bg-muted rounded-2xl p-6 border border-border relative overflow-hidden group">
           <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-2xs text-muted-foreground font-bold">Probabilidade IA</p>
                 {isUnknown ? (
                   <PredictionUnavailableNotice prediction={prediction} className="mt-1 space-y-0.5" />
                 ) : (
                   <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-6xl font-bold leading-none transition-colors duration-700",
                        risk.iconColor
                      )}>
                         {probability ?? '--'}
                      </span>
                   </div>
                 )}
              </div>
              <div className="flex flex-col items-end gap-2">
                 <div className={cn(
                   "px-3 py-2 rounded-xl text-2xs font-bold flex items-center gap-2 transition-all duration-700",
                   risk.color,
                   risk.shadow
                 )}>
                    <Circle className="h-2 w-2 fill-current" />
                    {risk.label}
                 </div>
                 <p className="text-2xs font-bold text-muted-foreground">Análise preditiva</p>
              </div>
           </div>
           {showsExperimentalLabel(prediction) && <ExperimentalBadge className="relative z-10 mt-4" />}
           <div className="absolute inset-0 pointer-events-none" />
        </div>

        {/* 3. Nearby sensors context */}
        {(precise?.latestReadings && precise.latestReadings.length > 0) || (point.nearbySensorIds && point.nearbySensorIds.length > 0) ? (
          <div className="space-y-3">
             <div className="flex items-center justify-between px-1">
                <p className="text-2xs text-muted-foreground font-bold">Rede de Sensores (3km)</p>
                <div className="h-px flex-1 mx-4 bg-muted" />
                <span className="text-2xs text-primary font-bold">
                  {precise?.latestReadings?.length || point.nearbySensorIds?.length || 0} Ativos
                </span>
             </div>
             <div className="grid grid-cols-1 gap-2">
                {precise?.latestReadings && precise.latestReadings.length > 0 ? (
                  precise.latestReadings.slice(0, 3).map((s) => (
                    <div key={`${s.sensorId}-${s.type}`} className="bg-muted px-4 py-2.5 rounded-xl border border-border flex items-center justify-between group/sensor">
                       <div className="flex items-center gap-3">
                          <Activity className="h-3 w-3 text-muted-foreground group-hover/sensor:text-primary transition-colors" />
                          <div>
                             <p className="text-2xs font-bold text-foreground leading-none">{s.sensorId}</p>
                             <p className="text-2xs font-bold text-muted-foreground mt-0.5">{s.type} • {s.distanceKm?.toFixed(1) ?? '--'}km</p>
                          </div>
                       </div>
                       <span className="text-2xs font-bold text-foreground">{s.value?.toFixed(1) ?? '--'}<small className="ml-0.5 text-2xs opacity-40 not-italic">{s.unit}</small></span>
                    </div>
                  ))
                ) : (
                  point.nearbySensorIds?.slice(0, 3).map((id) => (
                    <div key={id} className="bg-muted px-4 py-2.5 rounded-xl border border-border flex items-center justify-between group/sensor">
                       <div className="flex items-center gap-3">
                          <Zap className="h-3 w-3 text-muted-foreground" />
                          <div>
                             <p className="text-2xs font-bold text-foreground leading-none">{id}</p>
                             <p className="text-2xs font-bold text-muted-foreground mt-0.5">Aguardando telemetria...</p>
                          </div>
                       </div>
                    </div>
                  ))
                )}
                {((precise?.latestReadings?.length || 0) > 3 || (point.nearbySensorIds?.length || 0) > 3) && (
                  <p className="text-2xs text-center text-muted-foreground font-bold py-1">
                    + {Math.max(precise?.latestReadings?.length || 0, point.nearbySensorIds?.length || 0) - 3} outros sensores na região
                  </p>
                )}
             </div>
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-2xl border border-dashed border-border flex items-center justify-center gap-3">
             <Zap className="h-4 w-4 text-muted-foreground" />
             <span className="text-2xs font-bold text-muted-foreground">Nenhum sensor direto no raio</span>
          </div>
        )}

        {/* 4. Insight context */}
        {precise?.message && (
          <div className="p-4 bg-muted rounded-2xl border border-border flex gap-4 items-start relative group overflow-hidden">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-3.5 w-3.5 text-primary shrink-0" />
             </div>
             <p className="text-2xs text-muted-foreground leading-relaxed relative z-10 font-medium pr-2">
               {precise.message}
             </p>
          </div>
        )}

        {/* 5. Refined action button */}
        <div className="pt-2">
           <Button 
             onClick={onShowDetails}
             className="w-full h-12 text-2xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation-overlay transition-all duration-500 rounded-2xl group relative overflow-hidden"
           >
             <span className="relative z-10 flex items-center justify-center gap-3">
                Painel analítico completo
                <Maximize2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
             </span>
             <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
           </Button>
        </div>
      </div>
    </div>
  );
};
