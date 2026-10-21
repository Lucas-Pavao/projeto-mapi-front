import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalDialog } from '@/components/ui/modal-dialog';
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
    <ModalDialog label={`Reportar ocorrência em ${point.name}`} onClose={onClose} className="absolute inset-0 z-70 bg-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-card border-border shadow-elevation-overlay overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="bg-destructive/10 border-b border-destructive/40 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Reportar ocorrência</CardTitle>
              <p className="text-2xs text-muted-foreground font-bold mt-1">{point.name}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <span id="severity-label" className="text-2xs font-bold text-muted-foreground">Severidade observada</span>
              <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="severity-label">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    aria-pressed={severity === sev}
                    onClick={() => onSeverityChange(sev)}
                    className={cn(
                      "py-2 rounded-lg text-2xs font-bold border transition-all",
                      severity === sev 
                        ? "bg-destructive border-destructive/40 text-background shadow-elevation-raised" 
                        : "bg-muted border-border text-muted-foreground hover:border-input"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="report-description" className="text-2xs font-bold text-muted-foreground">Descrição da Ocorrência</label>
              <textarea 
                id="report-description"
                className="w-full bg-muted border border-border rounded-xl p-4 text-sm text-foreground focus:ring-1 focus:ring-destructive focus:border-destructive/40 outline-none min-h-[120px] transition-all"
                placeholder="Descreva o que está sendo observado no local (ex: trânsito parado, água acima do meio-fio)..."
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1 bg-muted hover:bg-muted text-foreground font-bold text-2xs h-12"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-destructive hover:bg-destructive/90 text-background font-bold text-2xs h-12 shadow-elevation-raised"
              onClick={onConfirm}
              disabled={isSubmitting || !description}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar registro
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </ModalDialog>
  );
};
