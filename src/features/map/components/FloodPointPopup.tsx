import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FloodPointResponseDTO, FloodPredictionResponseDTO } from '../types';

interface FloodPointPopupProps {
  point: FloodPointResponseDTO;
  prediction?: FloodPredictionResponseDTO;
  onShowDetails: () => void;
}

export const FloodPointPopup: React.FC<FloodPointPopupProps> = ({ 
  point, 
  onShowDetails,
  prediction 
}) => {
  return (
    <div className="bg-black/60 backdrop-blur-xl text-white rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden w-72">
      <div className={cn(
        "p-4 text-white font-bold flex flex-col gap-1 relative",
        prediction?.riskLevel === 'HIGH' || prediction?.riskLevel === 'CRITICAL' ? "bg-red-700/80" : "bg-red-600/80"
      )}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] opacity-80 uppercase tracking-widest">Ponto Crítico</span>
          <AlertTriangle className={cn("h-4 w-4", prediction?.riskLevel === 'CRITICAL' ? "animate-bounce" : "animate-pulse")} />
        </div>
        <h3 className="text-sm leading-tight font-bold">{point.nome}</h3>
        <p className="text-[10px] opacity-70 font-medium truncate">{point.municipio || 'Localidade não informada'}</p>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
             <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Probabilidade de Alagamento</p>
             <p className="text-2xl font-black text-white">
              {prediction ? `${(prediction.floodProbability * 100).toFixed(0)}%` : '--'}
             </p>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner",
            prediction?.riskLevel === 'CRITICAL' ? "text-red-500" : "text-red-400"
          )}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Nível Maré</span>
            <span className="text-[10px] font-bold text-white uppercase">{point.tideHeight !== null ? `${point.tideHeight}${point.tideUnit || 'm'}` : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-medium">Risco IA</span>
            <span className={cn(
              "text-[10px] font-bold uppercase",
              prediction?.riskLevel === 'CRITICAL' ? "text-red-500" : 
              prediction?.riskLevel === 'HIGH' ? "text-orange-500" : "text-emerald-500"
            )}>{prediction?.riskLevel || 'ANALISANDO'}</span>
          </div>
        </div>

        <Button 
          onClick={onShowDetails}
          className="w-full h-9 text-[10px] font-bold uppercase tracking-widest bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/20 rounded-xl transition-all shadow-lg shadow-red-900/10"
        >
          Analisar Risco Detalhado
        </Button>
      </div>
    </div>
  );
};
