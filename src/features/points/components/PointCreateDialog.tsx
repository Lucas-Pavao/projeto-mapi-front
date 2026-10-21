import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogPanel } from '@/components/ui/dialog-panel';
import { Field, Textarea } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { FloodPointRequestDTO } from '@/features/map/types';

interface Props {
  saving: boolean;
  error?: string | null;
  onSave: (body: FloodPointRequestDTO) => void;
  onClose: () => void;
}

const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/i;

export const PointCreateDialog: React.FC<Props> = ({ saving, error, onSave, onClose }) => {
  const [v, setV] = useState({ slug: '', name: '', municipality: '', description: '', latitude: '', longitude: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!SLUG_RE.test(v.slug.trim())) errs.slug = 'Use letras, números, hífen ou sublinhado (sem espaços).';
    if (!v.name.trim()) errs.name = 'Informe o nome.';
    const lat = num(v.latitude);
    const lon = num(v.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errs.latitude = 'Latitude entre -90 e 90.';
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) errs.longitude = 'Longitude entre -180 e 180.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ slug: v.slug.trim(), name: v.name.trim(), latitude: lat, longitude: lon, ...(v.municipality.trim() ? { municipality: v.municipality.trim() } : {}), ...(v.description.trim() ? { description: v.description.trim() } : {}) });
  };

  return (
    <DialogPanel title="Novo ponto crítico" description="Depois de criar, edite o ponto para ligar estações. Sem terreno carregado, a simulação do balde não funciona nele." onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Identificador (slug)" hint="Não muda depois." error={errors.slug}>{(p) => <Input {...p} value={v.slug} onChange={(e) => set('slug', e.target.value)} className="h-11 md:h-8" />}</Field>
        <Field label="Nome" error={errors.name}>{(p) => <Input {...p} value={v.name} onChange={(e) => set('name', e.target.value)} className="h-11 md:h-8" />}</Field>
        <Field label="Município">{(p) => <Input {...p} value={v.municipality} onChange={(e) => set('municipality', e.target.value)} className="h-11 md:h-8" />}</Field>
        <Field label="Descrição">{(p) => <Textarea {...p} value={v.description} onChange={(e) => set('description', e.target.value)} />}</Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Latitude" error={errors.latitude}>{(p) => <Input {...p} inputMode="decimal" value={v.latitude} onChange={(e) => set('latitude', e.target.value)} className="h-11 md:h-8" />}</Field>
          <Field label="Longitude" error={errors.longitude}>{(p) => <Input {...p} inputMode="decimal" value={v.longitude} onChange={(e) => set('longitude', e.target.value)} className="h-11 md:h-8" />}</Field>
        </div>
        {error && <p role="alert" className="text-body text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 px-4 md:h-8" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="h-11 px-4 md:h-8" disabled={saving}>{saving ? 'Criando…' : 'Criar ponto'}</Button>
        </div>
      </form>
    </DialogPanel>
  );
};
