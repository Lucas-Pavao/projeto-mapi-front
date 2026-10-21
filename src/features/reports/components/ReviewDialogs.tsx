import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { Field, Select, Textarea } from '@/components/ui/form-field';
import type { Severity } from '@/lib/apiSchemas';
import type { FloodReport, ReportReview } from '../schemas/report.schema';

interface PointOption { slug: string; name: string }

/** Gravidade observada do alagamento (FloodEvent.Severity). Não é a classe de risco do modelo. */
export const SEVERITY_LABEL: Record<Severity, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica' };

interface DialogProps {
  report: FloodReport;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
}

export const ConfirmReportDialog: React.FC<DialogProps & { points: PointOption[]; onSubmit: (b: ReportReview) => void }> = ({ report, points, saving, error, onSubmit, onClose }) => {
  const [slug, setSlug] = useState(report.nearestPointSlug ?? '');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return setErr('Escolha o ponto crítico a que este alagamento pertence.');
    if (note.length > 500) return setErr('A nota passa de 500 caracteres.');
    setErr(null);
    onSubmit({ status: 'CONFIRMED', floodPointSlug: slug, severity, ...(note.trim() ? { note: note.trim() } : {}) });
  };

  return (
    <DialogPanel title={`Confirmar relato #${report.id}`} description="Cria um evento de alagamento no ponto, assinado por você. Relato confirmado não entra nos rótulos da avaliação do modelo." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Ponto crítico" error={err && !slug ? err : null} hint={report.nearestPointSlug ? `Sugerido: o mais próximo, a ${report.nearestPointDistanceM ?? '—'} m.` : 'Nenhum ponto perto: escolha manualmente.'}>
          {(p) => (
            <Select {...p} value={slug} onChange={(e) => setSlug(e.target.value)}>
              <option value="">Escolha…</option>
              {points.map((pt) => <option key={pt.slug} value={pt.slug}>{pt.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Gravidade observada">
          {(p) => (
            <Select {...p} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Nota (opcional)" hint={`${note.length}/500`} error={err && slug ? err : null}>
          {(p) => <Textarea {...p} value={note} maxLength={600} onChange={(e) => setNote(e.target.value)} />}
        </Field>
        {error && <p role="alert" className="text-body text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="h-11 px-4 md:h-8" disabled={saving}>{saving ? 'Confirmando…' : 'Confirmar relato'}</Button>
        </div>
      </form>
    </DialogPanel>
  );
};

export const DiscardReportDialog: React.FC<DialogProps & { onSubmit: (b: ReportReview) => void }> = ({ report, saving, error, onSubmit, onClose }) => {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return setErr('Diga por que o relato foi descartado (duplicado, fora do local, sem evidência…).');
    if (reason.length > 500) return setErr('O motivo passa de 500 caracteres.');
    setErr(null);
    onSubmit({ status: 'DISCARDED', reason: reason.trim() });
  };
  return (
    <DialogPanel title={`Descartar relato #${report.id}`} description="O relato sai da fila e o motivo fica registrado." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Motivo" hint={`${reason.length}/500`} error={err}>
          {(p) => <Textarea {...p} value={reason} maxLength={600} onChange={(e) => setReason(e.target.value)} />}
        </Field>
        {error && <p role="alert" className="text-body text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="destructive" className="h-11 px-4 md:h-8" disabled={saving}>{saving ? 'Descartando…' : 'Descartar relato'}</Button>
        </div>
      </form>
    </DialogPanel>
  );
};
