import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/query-state';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TideDatumNotice } from '@/components/TideDatumNotice';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useSimulateBucket } from '@/features/model/hooks/useSimulateBucket';
import { SimulationResult } from '@/features/model/components/SimulationResult';
import { BUCKET_F_VALUES, bucketInputSchema } from '@/features/model/schemas/model.schema';
import { constantRain, parseRainList } from '@/features/model/utils/rain';
import { httpStatus } from '@/lib/apiError';

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')));

function simulationError(e: unknown): string {
  switch (httpStatus(e)) {
    case 422: return 'Este ponto não tem terreno carregado (ou um parâmetro está fora da faixa). Escolha outro ponto ou ajuste os valores.';
    case 503: return 'O serviço do modelo está indisponível agora. Tente de novo em instantes.';
    case 403: return 'Sem permissão ou sessão expirada. Entre de novo.';
    case 429: return 'Muitas simulações seguidas. Espere um pouco.';
    case null: return 'Sem conexão. Confira a rede e tente de novo.';
    default: return 'Não foi possível simular.';
  }
}

export const SimulatorPage: React.FC = () => {
  const points = useFloodPoints();
  const sim = useSimulateBucket();
  const [slug, setSlug] = useState('');
  const [mode, setMode] = useState<'constant' | 'manual'>('constant');
  const [intensity, setIntensity] = useState('30');
  const [hours, setHours] = useState('6');
  const [manual, setManual] = useState('5 10 20 40 20 10 5');
  const [f, setF] = useState<string>('1');
  const [scale, setScale] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastRain, setLastRain] = useState<number[]>([]);

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let rain: number[] = [];
    if (mode === 'constant') {
      const i = num(intensity);
      const h = num(hours);
      if (!Number.isFinite(i)) errs.intensity = 'Informe a intensidade em mm/h.';
      if (!Number.isFinite(h) || h < 1 || h > 72) errs.hours = 'Duração de 1 a 72 horas.';
      if (!errs.intensity && !errs.hours) rain = constantRain(i, h);
    } else {
      const r = parseRainList(manual);
      if (r.error) errs.manual = r.error;
      rain = r.values;
    }
    const parsed = bucketInputSchema.safeParse({ slug, rainfallMmH: rain, f: Number(f), curveScale: num(scale) });
    if (!parsed.success && Object.keys(errs).length === 0) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === 'rainfallMmH' ? (mode === 'constant' ? 'intensity' : 'manual') : String(issue.path[0]);
        errs[key] ??= issue.message;
      }
    }
    setErrors(errs);
    if (!parsed.success || Object.keys(errs).length) return;
    setLastRain(rain);
    sim.mutate(parsed.data);
  };

  const active = (points.data ?? []).filter((p) => p.active);

  return (
    <PageShell title="Simulador do balde (M1a)" description="Monte uma chuva e veja a lâmina de água que o modelo físico simples calcula num ponto.">
      <p role="note" className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-body-strong text-warning">
        <FlaskConical className="size-4 shrink-0" aria-hidden="true" /> Simulação — não é previsão. Resultado ilustrativo, sem maré, sem gravar nada.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <form onSubmit={run} noValidate aria-label="Parâmetros da simulação" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <Field label="Ponto" error={errors.slug} hint={points.isError ? 'Não foi possível carregar os pontos.' : points.isPending ? 'Carregando pontos…' : 'Só pontos com terreno carregado simulam.'}>
            {(p) => (
              <Select {...p} value={slug} onChange={(e) => setSlug(e.target.value)}>
                <option value="">Escolha…</option>
                {active.map((pt) => <option key={pt.slug} value={pt.slug}>{pt.name}</option>)}
              </Select>
            )}
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-body-strong text-foreground">Chuva</legend>
            <div role="group" aria-label="Como montar a chuva" className="flex gap-2">
              {([['constant', 'Constante'], ['manual', 'Hora a hora']] as const).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={mode === v} onClick={() => setMode(v)} className={`h-11 flex-1 rounded-lg border px-3 text-body-strong md:h-8 ${mode === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted'}`}>{l}</button>
              ))}
            </div>
            {mode === 'constant' ? (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Intensidade (mm/h)" error={errors.intensity}>{(p) => <Input {...p} inputMode="decimal" value={intensity} onChange={(e) => setIntensity(e.target.value)} className="h-11 md:h-8" />}</Field>
                <Field label="Duração (h)" error={errors.hours}>{(p) => <Input {...p} inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} className="h-11 md:h-8" />}</Field>
              </div>
            ) : (
              <Field label="Chuva por hora (mm/h)" hint="De 1 a 72 valores, de 0 a 300. Separe por espaço, linha ou “;”. Decimal: 2,5 ou 2.5." error={errors.manual}>
                {(p) => <Textarea {...p} value={manual} onChange={(e) => setManual(e.target.value)} />}
              </Field>
            )}
          </fieldset>
          <Field label="Fração f do balde" hint="f do parâmetro registrado; 1 = padrão.">
            {(p) => <Select {...p} value={f} onChange={(e) => setF(e.target.value)}>{BUCKET_F_VALUES.map((v) => <option key={v} value={v}>{v.toLocaleString('pt-BR')}</option>)}</Select>}
          </Field>
          <Field label="Escala da curva (0,7 a 1,3)" hint="1 = curva do terreno sem alteração." error={errors.curveScale}>
            {(p) => <Input {...p} inputMode="decimal" value={scale} onChange={(e) => setScale(e.target.value)} className="h-11 md:h-8" />}
          </Field>
          <Button type="submit" className="h-11 md:h-9" disabled={sim.isPending}>{sim.isPending ? 'Simulando…' : 'Simular'}</Button>
          <TideDatumNotice compact />
        </form>
        <div className="min-w-0">
          {sim.isError && <p role="alert" className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-body text-destructive">{simulationError(sim.error)}</p>}
          {sim.isPending ? (
            <div role="status" className="flex min-h-40 items-center justify-center rounded-xl border border-border bg-card text-body text-muted-foreground">Simulando…</div>
          ) : sim.data ? (
            <SimulationResult sim={sim.data} rain={lastRain} />
          ) : (
            !sim.isError && <EmptyState title="Nenhuma simulação ainda." hint="Escolha um ponto e a chuva, depois toque em Simular." />
          )}
        </div>
      </div>
    </PageShell>
  );
};
export default SimulatorPage;
