import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { EmptyState } from '@/components/ui/query-state';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/form-field';
import { TideDatumNotice } from '@/components/TideDatumNotice';
import { useFloodPoints } from '@/features/points/hooks/useFloodPoints';
import { useSimulateBucket } from '@/features/model/hooks/useSimulateBucket';
import { SimulationResult } from '@/features/model/components/SimulationResult';
import { ParamSlider } from '@/features/model/components/ParamSlider';
import { bucketInputSchema } from '@/features/model/schemas/model.schema';
import { constantRain, padRain, parseRainList, triangularRain } from '@/features/model/utils/rain';
import { httpStatus } from '@/lib/apiError';

const fmt = (v: number, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

type Shape = 'block' | 'tri' | 'manual';
const PRESETS = [
  { id: 'rean', value: '16,7 mm/h', label: 'máx. da reanálise', P: 16.7, shape: 'block' as const },
  { id: 'idf', value: '75 mm/h', label: 'pancada com pico', P: 75, shape: 'tri' as const },
  { id: 'lim', value: '50,3 mm/h', label: 'limiar IDF (B3)', P: 50.3, shape: 'block' as const },
  { id: 'ext', value: '90 mm/h', label: 'chuva extrema 1 h', P: 90, shape: 'block' as const },
];
const SHAPES: Array<[Shape, string]> = [['block', 'Constante'], ['tri', 'Pico no meio'], ['manual', 'Hora a hora']];

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
  const [shape, setShape] = useState<Shape>('tri');
  const [preset, setPreset] = useState<string | null>('idf');
  const [peak, setPeak] = useState(75);
  const [hours, setHours] = useState(1);
  const [manual, setManual] = useState('5 10 20 40 20 10 5');
  const [f, setF] = useState(1);
  const [scale, setScale] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastRain, setLastRain] = useState<number[]>([]);

  const edit = (fn: () => void) => { setPreset(null); fn(); };

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let rain: number[];
    if (shape === 'manual') {
      const r = parseRainList(manual);
      if (r.error) errs.manual = r.error;
      rain = r.values;
    } else {
      const base = shape === 'tri' ? triangularRain(peak, hours) : constantRain(peak, hours);
      rain = padRain(base, Math.max(6, hours + 2));
    }
    const parsed = bucketInputSchema.safeParse({ slug, rainfallMmH: rain, f, curveScale: scale });
    if (!parsed.success && Object.keys(errs).length === 0) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === 'rainfallMmH' ? 'manual' : String(issue.path[0]);
        errs[key] ??= issue.message;
      }
    }
    setErrors(errs);
    if (!parsed.success || Object.keys(errs).length) return;
    setLastRain(rain);
    sim.mutate(parsed.data);
  };

  const active = (points.data ?? []).filter((p) => p.active);
  const panel = 'rounded-2xl border border-border bg-card';

  return (
    <div className="flex w-full flex-col gap-4 p-4 lg:h-full lg:flex-row">
      <form onSubmit={run} noValidate aria-label="Parâmetros da simulação" className={`${panel} custom-scrollbar flex shrink-0 flex-col gap-3.5 p-[18px] lg:w-[380px] lg:overflow-y-auto`}>
        <div>
          <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">Simulador do balde</h1>
          <p className="mt-1 mb-0 text-[13px] leading-[18px] text-muted-foreground">Modelo físico M1a (projeto-mapi-ai/avaliacao/balde.py): a chuva enche a depressão da rua e a galeria esvazia até a capacidade de projeto.</p>
          <p role="note" className="mt-2 mb-0 flex items-center gap-1.5 text-xs leading-4 font-bold text-warning">
            <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" /> Simulação — não é previsão. Ilustrativo, sem maré.
          </p>
        </div>
        <Field label="Ponto" error={errors.slug} hint={points.isError ? 'Não foi possível carregar os pontos.' : points.isPending ? 'Carregando pontos…' : undefined}>
          {(p) => (
            <Select {...p} value={slug} onChange={(e) => setSlug(e.target.value)}>
              <option value="">Escolha (só pontos com terreno simulam)…</option>
              {active.map((pt) => <option key={pt.slug} value={pt.slug}>{pt.name}</option>)}
            </Select>
          )}
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-[0.06em] text-muted-foreground">CENÁRIOS PRONTOS</span>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((q) => {
              const on = preset === q.id;
              return (
                <button key={q.id} type="button" aria-pressed={on} onClick={() => { setPreset(q.id); setPeak(q.P); setHours(1); setShape(q.shape); }} className={`min-h-11 rounded-[10px] border px-2.5 py-2 text-left text-foreground ${on ? 'border-primary bg-primary/15' : 'border-border bg-transparent'}`}>
                  <span className="block font-mono text-sm leading-[18px] font-bold">{q.value}</span>
                  <span className="block text-[11px] leading-[14px] text-muted-foreground">{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {shape !== 'manual' && (
          <>
            <ParamSlider label="Intensidade da chuva (pico)" valueText={`${fmt(peak)} mm/h`} hint="i_T de projeto (TR 5 anos, 60 min) = 60,1 mm/h" min={5} max={120} step={0.5} value={peak} onChange={(v) => edit(() => setPeak(v))} />
            <ParamSlider label="Duração" valueText={`${fmt(hours)} h`} hint="Depois disso a chuva para" min={1} max={6} step={1} value={hours} onChange={(v) => edit(() => setHours(v))} />
          </>
        )}
        <ParamSlider label="Fração da capacidade f" valueText={fmt(f)} hint="f = 1: galeria opera como projetada; menor = obstruída" min={0} max={1} step={0.2} value={f} onChange={(v) => setF(Number(v.toFixed(1)))} />
        <ParamSlider label="Escala da curva" valueText={fmt(scale, 2)} hint="1 = curva cota-volume do terreno sem alteração (0,7 a 1,3)" min={0.7} max={1.3} step={0.05} value={scale} error={errors.curveScale} onChange={(v) => setScale(Number(v.toFixed(2)))} />
        <div className="flex flex-col gap-1.5">
          <span id="forma-chuva" className="text-[13px] font-bold">Forma da chuva</span>
          <div role="radiogroup" aria-labelledby="forma-chuva" className="grid grid-cols-3 gap-1 rounded-[10px] bg-muted p-1">
            {SHAPES.map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={shape === v} onClick={() => { setPreset(null); setShape(v); }} className={`h-11 rounded-lg border-0 text-xs leading-4 font-bold text-foreground md:h-[30px] ${shape === v ? 'bg-card' : 'bg-transparent'}`}>{l}</button>
            ))}
          </div>
        </div>
        {shape === 'manual' && (
          <Field label="Chuva por hora (mm/h)" hint="De 1 a 72 valores, de 0 a 300. Separe por espaço, linha ou “;”. Decimal: 2,5 ou 2.5." error={errors.manual}>
            {(p) => <Textarea {...p} value={manual} onChange={(e) => setManual(e.target.value)} />}
          </Field>
        )}
        <div className="rounded-[10px] border border-dashed border-border p-2.5 text-[13px] leading-[18px]">
          <strong>Fora do M1a real</strong>
          <br />
          <span className="text-muted-foreground">Coeficiente C, área contribuinte, área da depressão, cota da rua e freio de maré (M1b) não são controles do modelo: o M1a só aceita f e a escala da curva (ADR 0014). Sem maré: a variante só entra com o desnível entre as referências aprovado (ADR 0009).</span>
        </div>
        <TideDatumNotice compact />
        <div className="sticky bottom-0 -mx-[18px] -mb-[18px] bg-card px-[18px] pt-2 pb-[18px]">
          <Button type="submit" className="h-11 w-full md:h-9" disabled={sim.isPending}>{sim.isPending ? 'Simulando…' : 'Simular'}</Button>
        </div>
      </form>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        {sim.isError && <p role="alert" className="m-0 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-body text-destructive">{simulationError(sim.error)}</p>}
        {sim.isPending ? (
          <div role="status" className={`${panel} flex min-h-40 items-center justify-center text-body text-muted-foreground`}>Simulando…</div>
        ) : sim.data ? (
          <SimulationResult key={sim.submittedAt} sim={sim.data} rain={lastRain} />
        ) : (
          !sim.isError && <EmptyState title="Nenhuma simulação ainda." hint="Escolha um ponto e a chuva, depois toque em Simular." />
        )}
      </div>
    </div>
  );
};
export default SimulatorPage;
