import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FloodPointRequestDTO, FloodPointResponseDTO } from '@/features/map/types';
import { useDebounced } from '../hooks/useDebounced';
import { useStationSuggestions } from '../hooks/usePointsAdmin';
import type { FloodPointPatch } from '../schemas/point-admin.schema';
import { buildPatch, formFromPoint } from '../utils/pointPatch';
import { PointLocationMap } from './PointLocationMap';

export type EditorMode = { kind: 'edit'; point: FloodPointResponseDTO } | { kind: 'create' };

interface PointEditorProps {
  mode: EditorMode;
  saving: boolean;
  error: string | null;
  saved: boolean;
  onSavePatch: (patch: FloodPointPatch) => void;
  onCreate: (body: FloodPointRequestDTO) => void;
  onClear: () => void;
}

interface State {
  slug: string; name: string; municipality: string; description: string;
  latitude: string; longitude: string; altitude: string; distance: string; threshold: string;
  active: boolean; pluv: string[]; river: string[];
}

const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/i;
const toNum = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const km = (m: number) => (m / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function initial(mode: EditorMode): State {
  if (mode.kind === 'create') return { slug: '', name: '', municipality: 'Recife', description: '', latitude: '', longitude: '', altitude: '', distance: '', threshold: '', active: true, pluv: [], river: [] };
  const p = mode.point;
  const f = formFromPoint(p);
  return {
    slug: p.slug, name: f.name, municipality: p.municipality ?? '', description: f.description, latitude: f.latitude, longitude: f.longitude,
    altitude: p.altitudeM != null ? String(p.altitudeM) : '', distance: p.distanceToChannelM != null ? String(p.distanceToChannelM) : '',
    threshold: f.alertThresholdMm, active: f.active, pluv: f.pluviometerStationIds, river: f.riverLevelStationIds,
  };
}

const inputCls = 'h-11 rounded-lg border-input px-2.5 text-sm md:h-[38px]';

/** Formulário do ponto: mapa para posicionar, estações no raio de 3 km e campos. Edita (PATCH parcial) ou cria (POST). */
export const PointEditor: React.FC<PointEditorProps> = ({ mode, saving, error, saved, onSavePatch, onCreate, onClear }) => {
  const [s, setS] = useState<State>(() => initial(mode));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const edit = mode.kind === 'edit';
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  const lat = toNum(s.latitude);
  const lon = toNum(s.longitude);
  const coordOk = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  const dLat = useDebounced(coordOk ? lat : null);
  const dLon = useDebounced(coordOk ? lon : null);
  const suggestions = useStationSuggestions(dLat, dLon, dLat != null && dLon != null);
  const linked = useMemo(() => new Set([...s.pluv, ...s.river]), [s.pluv, s.river]);
  const known = new Set((suggestions.data ?? []).map((x) => x.stationId));
  const orphans = [...linked].filter((id) => !known.has(id));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (edit) {
      const { patch, errors: errs } = buildPatch(mode.point, {
        name: s.name, description: s.description, latitude: s.latitude, longitude: s.longitude, active: s.active,
        alertThresholdMm: s.threshold, pluviometerStationIds: s.pluv, riverLevelStationIds: s.river,
      });
      if (Object.keys(patch).length === 0 && Object.keys(errs).length === 0) errs.form = 'Nada mudou.';
      setErrors(errs);
      if (Object.keys(errs).length === 0) onSavePatch(patch);
      return;
    }
    const errs: Record<string, string> = {};
    if (!SLUG_RE.test(s.slug.trim())) errs.slug = 'Use letras, números, hífen ou sublinhado (sem espaços).';
    if (!s.name.trim()) errs.name = 'Informe o nome.';
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errs.latitude = 'Latitude entre -90 e 90.';
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) errs.longitude = 'Longitude entre -180 e 180.';
    const alt = toNum(s.altitude);
    const dist = toNum(s.distance);
    if (s.altitude.trim() !== '' && !Number.isFinite(alt)) errs.altitude = 'Número em metros.';
    if (s.distance.trim() !== '' && !Number.isFinite(dist)) errs.distance = 'Número em metros.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onCreate({
      slug: s.slug.trim(), name: s.name.trim(), latitude: lat, longitude: lon,
      ...(s.municipality.trim() ? { municipality: s.municipality.trim() } : {}),
      ...(s.description.trim() ? { description: s.description.trim() } : {}),
      ...(Number.isFinite(alt) ? { altitudeM: alt } : {}),
      ...(Number.isFinite(dist) ? { distanceToChannelM: dist } : {}),
      ...(s.pluv.length || s.river.length ? { sensorConfig: { pluviometerStationIds: s.pluv, riverLevelStationIds: s.river } } : {}),
    });
  };

  const field = (key: keyof State, label: string, opts: { span?: number; mono?: boolean; req?: string; readOnly?: boolean; err?: string; mode?: 'decimal' } = {}) => {
    const id = `ponto-${key}`;
    return (
      <div key={key} className="flex flex-col gap-1" style={{ gridColumn: opts.span ? `span ${opts.span}` : undefined }}>
        <label htmlFor={id} className="text-[13px] font-bold">{label} {opts.req && <span className="font-normal text-muted-foreground">{opts.req}</span>}</label>
        <Input id={id} value={s[key] as string} readOnly={opts.readOnly} inputMode={opts.mode} aria-invalid={opts.err ? true : undefined} aria-describedby={opts.err ? `${id}-err` : undefined} onChange={(e) => set(key, e.target.value as never)} className={`${inputCls} ${opts.mono ? 'font-mono' : ''} ${opts.readOnly ? 'opacity-70' : ''}`} />
        {opts.err && <p id={`${id}-err`} role="alert" className="m-0 text-xs text-destructive">{opts.err}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Editar ponto" className="custom-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-3.5 overflow-y-auto rounded-2xl border border-border bg-card p-[18px]">
      <div className="flex items-center gap-3">
        <h2 className="m-0 flex-1 text-lg leading-6 font-extrabold">{edit ? `Editar · ${s.name || s.slug}` : 'Novo ponto crítico'}</h2>
        <span className="font-mono text-xs text-muted-foreground">{edit ? `PATCH /api/pontos/${s.slug}` : 'POST /api/pontos'}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <PointLocationMap latitude={coordOk ? lat : null} longitude={coordOk ? lon : null} onPick={(la, lo) => setS((p) => ({ ...p, latitude: String(la), longitude: String(lo) }))} />
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-[0.06em] text-muted-foreground">ESTAÇÕES NO RAIO DE 3 KM</span>
          {suggestions.isError && <p role="alert" className="m-0 text-xs text-destructive">Não foi possível buscar estações. Tente de novo.</p>}
          <ul aria-label="Estações sugeridas" className="m-0 flex list-none flex-col gap-2 p-0">
            {(suggestions.data ?? []).map((st) => {
              const key = st.type === 'PRECIPITATION' ? 'pluv' : 'river';
              const on = s[key].includes(st.stationId);
              return (
                <li key={st.stationId}>
                  <label className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border px-2.5 py-2 text-[13px] ${on ? 'border-primary' : 'border-border'}`}>
                    <input type="checkbox" checked={on} onChange={() => set(key, toggle(s[key], st.stationId))} className="m-0 size-4 accent-primary" />
                    <span className="flex-1">{st.name}<br /><span className="font-mono text-[11px] text-muted-foreground">{st.stationId} · {km(st.distanceM)} km</span></span>
                  </label>
                </li>
              );
            })}
            {orphans.map((id) => (
              <li key={id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-primary px-2.5 py-2 text-[13px]">
                  <input type="checkbox" checked onChange={() => { set('pluv', s.pluv.filter((x) => x !== id)); set('river', s.river.filter((x) => x !== id)); }} className="m-0 size-4 accent-primary" />
                  <span className="flex-1">Ligada ao ponto<br /><span className="font-mono text-[11px] text-muted-foreground">{id} · fora do raio</span></span>
                </label>
              </li>
            ))}
          </ul>
          {coordOk && suggestions.data?.length === 0 && <p className="m-0 text-xs text-warning">Nenhuma estação em 3 km. A previsão usaria só o Open-Meteo.</p>}
          {suggestions.isPending && suggestions.fetchStatus !== 'idle' && <p role="status" className="m-0 text-xs text-muted-foreground">Procurando estações…</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {field('slug', 'Slug', { mono: true, req: edit ? '(não muda)' : '(obrigatório)', readOnly: edit, err: errors.slug })}
        {field('name', 'Nome do local', { span: 2, req: '(obrigatório)', err: errors.name })}
        {field('municipality', 'Município', { readOnly: edit })}
        {field('latitude', 'Latitude', { mono: true, req: '(obrigatório)', mode: 'decimal', err: errors.latitude })}
        {field('longitude', 'Longitude', { mono: true, req: '(obrigatório)', mode: 'decimal', err: errors.longitude })}
        {field('altitude', 'Altitude (m)', { mono: true, req: 'MDT PE3D', readOnly: edit, mode: 'decimal', err: errors.altitude })}
        {field('distance', 'Distância ao canal (m)', { mono: true, readOnly: edit, mode: 'decimal', err: errors.distance })}
        {field('description', 'Descrição', { span: 4 })}
        {edit && field('threshold', 'Limiar de alerta de chuva (mm)', { span: 2, mono: true, mode: 'decimal', err: errors.alertThresholdMm })}
        {edit && (
          <label className="flex min-h-11 items-end gap-2 pb-2 text-[13px] font-semibold sm:col-span-2" htmlFor="ponto-ativo">
            <input id="ponto-ativo" type="checkbox" checked={s.active} onChange={(e) => set('active', e.target.checked)} className="size-4 accent-primary" /> Ponto ativo (entra no ciclo de previsão)
          </label>
        )}
      </div>
      <p className="m-0 rounded-[10px] border border-dashed border-border p-2.5 text-xs leading-4 text-muted-foreground">
        Os parâmetros do balde por ponto (capacidade, saída, freio de maré, fração C e cota da rua) não são editáveis: o M1a real só aceita f e a escala da curva na simulação (ADR 0014). Sem terreno carregado, a simulação não funciona neste ponto.
        {edit && ' Altitude, distância e município só mudam no cadastro.'}
      </p>
      <div className="sticky -bottom-[18px] -mx-[18px] -mb-[18px] flex items-center gap-2.5 border-t border-border bg-card px-[18px] py-3">
        {saved && !error && <span role="status" className="flex-1 text-[13px] font-bold text-success">Ponto salvo. Entra no próximo ciclo de previsão.</span>}
        {error && <span role="alert" className="flex-1 text-[13px] font-bold text-destructive">{error}</span>}
        {errors.form && <span role="alert" className="flex-1 text-[13px] font-bold text-warning">{errors.form}</span>}
        <span className="flex-1" />
        <Button type="button" variant="ghost" className="h-11 px-3 md:h-9" onClick={onClear}>Limpar</Button>
        <Button type="submit" className="h-11 px-4 md:h-9" disabled={saving}>{saving ? 'Salvando…' : 'Salvar ponto'}</Button>
      </div>
    </form>
  );
};
