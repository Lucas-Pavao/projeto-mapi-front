import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { Field, Textarea } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { FloodPointResponseDTO } from '@/features/map/types';
import { useStationSuggestions } from '../hooks/usePointsAdmin';
import type { FloodPointPatch } from '../schemas/point-admin.schema';
import { buildPatch, formFromPoint, type PointForm } from '../utils/pointPatch';
import { formatRecife } from '@/features/map/utils/datetime';

interface Props {
  point: FloodPointResponseDTO;
  saving: boolean;
  error?: string | null;
  onSave: (patch: FloodPointPatch) => void;
  onClose: () => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const PointEditDialog: React.FC<Props> = ({ point, saving, error, onSave, onClose }) => {
  const [f, setF] = useState<PointForm>(() => formFromPoint(point));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggest, setSuggest] = useState(false);
  const lat = Number(f.latitude.replace(',', '.'));
  const lon = Number(f.longitude.replace(',', '.'));
  const coordOk = Number.isFinite(lat) && Number.isFinite(lon) && f.latitude.trim() !== '' && f.longitude.trim() !== '';
  const suggestions = useStationSuggestions(coordOk ? lat : null, coordOk ? lon : null, suggest);
  const set = <K extends keyof PointForm>(k: K, v: PointForm[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { patch, errors: errs } = buildPatch(point, f);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (Object.keys(patch).length === 0) return setErrors({ form: 'Nada mudou.' });
    onSave(patch);
  };

  return (
    <DialogPanel title={`Editar ${point.name}`} description="Só os campos alterados são enviados. Mudar estações ou coordenada altera as próximas previsões." onClose={onClose} className="sm:max-w-2xl">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Nome" error={errors.name}>{(p) => <Input {...p} value={f.name} onChange={(e) => set('name', e.target.value)} className="h-11 md:h-8" />}</Field>
        <Field label="Descrição">{(p) => <Textarea {...p} value={f.description} onChange={(e) => set('description', e.target.value)} />}</Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Latitude" error={errors.latitude}>{(p) => <Input {...p} inputMode="decimal" value={f.latitude} onChange={(e) => set('latitude', e.target.value)} className="h-11 md:h-8" />}</Field>
          <Field label="Longitude" error={errors.longitude}>{(p) => <Input {...p} inputMode="decimal" value={f.longitude} onChange={(e) => set('longitude', e.target.value)} className="h-11 md:h-8" />}</Field>
        </div>
        <Field label="Limiar de alerta de chuva (mm)" hint="Em branco = sem limiar próprio." error={errors.alertThresholdMm}>
          {(p) => <Input {...p} inputMode="decimal" value={f.alertThresholdMm} onChange={(e) => set('alertThresholdMm', e.target.value)} className="h-11 md:h-8" />}
        </Field>
        <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <legend className="px-1 text-body-strong text-foreground">Estações ligadas</legend>
          <p className="text-caption text-muted-foreground">Pluviômetros: <span className="text-code">{f.pluviometerStationIds.join(', ') || 'nenhum'}</span></p>
          <p className="text-caption text-muted-foreground">Rios: <span className="text-code">{f.riverLevelStationIds.join(', ') || 'nenhum'}</span></p>
          <Button type="button" variant="outline" className="h-11 w-fit px-4 md:h-8" disabled={!coordOk} onClick={() => setSuggest(true)}>Sugerir estações perto desta coordenada</Button>
          {suggest && suggestions.isPending && <p role="status" className="text-caption text-muted-foreground">Procurando estações…</p>}
          {suggest && suggestions.isError && <p role="alert" className="text-caption text-destructive">Não foi possível buscar estações. Tente de novo.</p>}
          {suggest && suggestions.data && (suggestions.data.length === 0 ? (
            <p className="text-caption text-muted-foreground">Nenhuma estação a até 3 km.</p>
          ) : (
            <ul className="flex flex-col gap-1" aria-label="Estações sugeridas">
              {suggestions.data.map((s) => {
                const key = s.type === 'PRECIPITATION' ? 'pluviometerStationIds' : 'riverLevelStationIds';
                const checked = f[key].includes(s.stationId);
                return (
                  <li key={s.stationId}>
                    <label className="flex min-h-11 items-start gap-2 rounded-lg p-1 text-body text-foreground hover:bg-muted">
                      <input type="checkbox" checked={checked} onChange={() => set(key, toggle(f[key], s.stationId))} className="mt-1 size-4" />
                      <span>
                        <span className="block text-body-strong">{s.name} <span className="text-code text-muted-foreground">({s.stationId})</span></span>
                        <span className="block text-caption text-muted-foreground">{s.type === 'PRECIPITATION' ? 'Chuva' : 'Rio'} · {s.source} · a {s.distanceM} m · última leitura {formatRecife(s.lastReadingAt) ?? 'sem registro'}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ))}
        </fieldset>
        <label className="flex min-h-11 items-center gap-2 text-body text-foreground">
          <input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} className="size-4" /> Ponto ativo (entra no ciclo de previsão)
        </label>
        {errors.form && <p role="alert" className="text-body text-warning">{errors.form}</p>}
        {error && <p role="alert" className="text-body text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="h-11 px-4 md:h-8" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</Button>
        </div>
      </form>
    </DialogPanel>
  );
};
