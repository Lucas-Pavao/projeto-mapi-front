import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { Field, Select, Textarea } from '@/components/ui/form-field';
import { WATER_DEPTH_LABEL } from '@/features/reports/utils/labels';
import type { WaterDepth } from '@/features/reports/schemas/report.schema';

export interface ReportTarget {
  lat: number;
  lng: number;
  /** Nome do ponto crítico, "o local que você tocou" ou "sua posição". */
  label: string;
}

export interface ReportFormValues {
  waterDepth: WaterDepth | null;
  description: string | null;
}

interface Props {
  target: ReportTarget;
  submitting: boolean;
  error?: string | null;
  onSubmit: (v: ReportFormValues) => void;
  onClose: () => void;
}

const DEPTHS = Object.keys(WATER_DEPTH_LABEL) as WaterDepth[];

/**
 * Relato de alagamento (POST /api/reports). Vai para a fila de um operador conferir; não vira alerta nem
 * muda a previsão por si. Diálogo em folha no celular e centralizado no desktop (DialogPanel).
 */
export const ReportFloodModal: React.FC<Props> = ({ target, submitting, error, onSubmit, onClose }) => {
  const [depth, setDepth] = useState<WaterDepth | ''>('');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length > 1000) return setErr('A descrição passa de 1000 caracteres.');
    setErr(null);
    onSubmit({ waterDepth: depth || null, description: description.trim() || null });
  };

  return (
    <DialogPanel title="Reportar alagamento" description="Seu relato vai para a fila de um operador conferir. Ele não vira alerta nem muda a previsão sozinho." onClose={() => { if (!submitting) onClose(); }}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <p className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-body text-foreground">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{target.label} <span className="text-code text-muted-foreground">({target.lat.toFixed(5)}, {target.lng.toFixed(5)})</span></span>
        </p>
        <Field label="Altura da água" hint="Como você vê agora. Pode deixar em branco.">
          {(p) => (
            <Select {...p} value={depth} onChange={(e) => setDepth(e.target.value as WaterDepth | '')}>
              <option value="">Não sei dizer</option>
              {DEPTHS.map((d) => <option key={d} value={d}>{WATER_DEPTH_LABEL[d]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="O que você viu (opcional)" hint={`${description.length}/1000`} error={err}>
          {(p) => <Textarea {...p} value={description} maxLength={1100} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
        {error && <p role="alert" className="text-body text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" disabled={submitting} onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="h-11 px-4 md:h-8" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar relato'}</Button>
        </div>
      </form>
    </DialogPanel>
  );
};

export default ReportFloodModal;
