import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FloodPointResponseDTO } from '../types';

interface ReportFloodModalProps {
  point: FloodPointResponseDTO;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  isSubmitting: boolean;
  onSeverityChange: (severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void;
  onDescriptionChange: (description: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const ReportFloodModal: React.FC<ReportFloodModalProps> = ({
  point,
  severity,
  description,
  isSubmitting,
  onSeverityChange,
  onDescriptionChange,
  onConfirm,
  onClose
}) => {
  return (
    <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="bg-red-600/10 border-b border-red-500/20 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <div>
              <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Reportar Ocorrência</CardTitle>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{point.nome}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Severidade Observada</label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => onSeverityChange(sev)}
                    className={cn(
                      "py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter border transition-all",
                      severity === sev 
                        ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40" 
                        : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Descrição da Ocorrência</label>
              <textarea 
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none min-h-[120px] transition-all"
                placeholder="Descreva o que está sendo observado no local (ex: trânsito parado, água acima do meio-fio)..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-[11px] tracking-widest h-12"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[11px] tracking-widest h-12 shadow-lg shadow-red-900/20"
              onClick={onConfirm}
              disabled={isSubmitting || !description}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Registro
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
