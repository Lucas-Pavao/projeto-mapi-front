import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, RefreshCw, X, Check } from 'lucide-react';

interface ReportScenarioModalProps {
  latitude: number;
  longitude: number;
  isSubmitting: boolean;
  title: string;
  onConfirm: (isFlooded: boolean) => void;
  onClose: () => void;
}

export const ReportScenarioModal: React.FC<ReportScenarioModalProps> = ({
  latitude,
  longitude,
  isSubmitting,
  title,
  onConfirm,
  onClose
}) => {
  return (
    <div className="absolute inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden animate-in scale-in-95 duration-200">
        <CardHeader className="bg-primary/10 border-b border-primary/20 p-6 relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Reportar Cenário</CardTitle>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                Coord: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-center py-2">
            <p className="text-sm font-medium text-zinc-300 leading-relaxed">
              {title}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] tracking-widest h-14 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
              onClick={() => onConfirm(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Sim, está alagada
                </>
              )}
            </Button>
            
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-widest h-14 shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
              onClick={() => onConfirm(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Não, está livre / normal
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <button 
              className="text-[10px] text-zinc-500 hover:text-zinc-400 font-bold uppercase tracking-widest transition-colors"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportScenarioModal;
