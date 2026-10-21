import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, RefreshCw, X, Check } from 'lucide-react';
import { ModalDialog } from '@/components/ui/modal-dialog';

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
    <ModalDialog label="Reportar cenário no local" onClose={() => { if (!isSubmitting) onClose(); }} className="absolute inset-0 z-80 bg-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-elevation-overlay overflow-hidden animate-in scale-in-95 duration-200">
        <CardHeader className="bg-primary/10 border-b border-primary/20 p-6 relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Reportar cenário</CardTitle>
              <p className="text-2xs text-muted-foreground font-bold mt-1">
                Coord: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </div>
          </div>
          <button 
            type="button"
            aria-label="Fechar"
            onClick={onClose} 
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-center py-2">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {title}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-destructive hover:bg-destructive/90 text-background font-bold text-2xs h-14 shadow-elevation-raised flex items-center justify-center gap-2"
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
              className="w-full bg-success hover:bg-success/90 text-background font-bold text-2xs h-14 shadow-elevation-raised flex items-center justify-center gap-2"
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
              className="text-2xs text-muted-foreground hover:text-muted-foreground font-bold transition-colors"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </CardContent>
      </Card>
    </ModalDialog>
  );
};

export default ReportScenarioModal;
