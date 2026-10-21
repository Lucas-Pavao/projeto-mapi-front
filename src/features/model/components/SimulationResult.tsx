import React, { useEffect, useState } from 'react';
import { Pause, Play, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BucketSimulation } from '../schemas/model.schema';
import { BucketChart } from './BucketChart';
import { StreetCut } from './StreetCut';

const fmt = (v: number, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const panel = 'rounded-2xl border border-border bg-card';
const overline = 'm-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground';

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Resultado da simulação (M1a, ilustrativo): cartões, corte da rua com cursor, gráfico e leitura. Só mostra o que a API devolveu. */
export const SimulationResult: React.FC<{ sim: BucketSimulation; rain: number[] }> = ({ sim, rain }) => {
  const { hMm, hmaxMm } = sim;
  const hcrit = sim.paramsUsed.hcrit_mm;
  const n = hMm.length;
  const peakHour = hMm.indexOf(hmaxMm) + 1;
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const [cursor, setCursor] = useState(() => (reducedMotion() ? peakHour : 0));
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setCursor((c) => (c + 1) % (n + 1)), 700);
    return () => clearInterval(id);
  }, [playing, n]);

  const hNow = cursor === 0 ? 0 : hMm[Math.min(cursor, n) - 1];
  const above = hMm.filter((v) => v >= hcrit).length;
  const capacity = sim.paramsUsed.f * sim.paramsUsed.iT_mm_h;
  const rainMax = Math.max(0, ...rain);
  const crosses = hmaxMm >= hcrit;
  const cursorText = `${cursor}h após o início`;
  const hcritCm = fmt(hcrit / 10, 0);

  const verdictTitle = crosses ? `A rua alaga: a lâmina passa de ${hcritCm} cm.` : hmaxMm > 0 ? `A lâmina chega a ${fmt(hmaxMm / 10)} cm, abaixo de ${hcritCm} cm.` : 'A galeria dá conta: nada acumula.';
  const verdictText = hmaxMm > 0
    ? `A chuva informada chega a ${fmt(rainMax)} mm/h e a galeria escoa até f·i_T = ${fmt(capacity)} mm/h. O excesso enche a depressão e, passada a cota da rua, vira lâmina d’água.`
    : `Com f = ${fmt(sim.paramsUsed.f)}, só transborda se a chuva passar de f·i_T = ${fmt(capacity)} mm/h. A chuva informada chega a ${fmt(rainMax)} mm/h.`;

  const outs: Array<{ label: string; value: string; sub: string; hot?: boolean; testid?: string; tone?: string }> = [
    { label: 'Lâmina máxima na rua', value: `${fmt(hmaxMm / 10)} cm`, sub: `limite crítico ${hcritCm} cm`, hot: crosses },
    { label: `Tempo até ${hcritCm} cm`, value: sim.tCrossH == null ? '—' : `${sim.tCrossH + 1} h`, sub: sim.tCrossH == null ? 'não passa nesta chuva' : `na hora ${sim.tCrossH + 1} (índice ${sim.tCrossH})`, testid: 'cross' },
    { label: `Duração acima de ${hcritCm} cm`, value: above === 0 ? '—' : `${above} h`, sub: 'horas simuladas acima do limite' },
    { label: 'Fora da curva cota-volume', value: `${sim.nOutsideCurve} h`, sub: sim.nOutsideCurve > 0 ? 'valor extrapolado, vale menos' : 'todas as horas dentro da curva' },
    { label: 'Lâmina agora', value: `${fmt(hNow / 10)} cm`, sub: 'no cursor do corte', hot: hNow >= hcrit, tone: 'cursor' },
  ];

  return (
    <section aria-label="Resultado da simulação" className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto]">
      <h2 className="sr-only">Resultado (simulação, não é previsão)</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-12 lg:grid-cols-5">
        {outs.map((o) => (
          <div key={o.label} className={cn('rounded-2xl border bg-card px-4 py-3.5', o.hot ? 'border-risk-high-edge' : 'border-border')}>
            <div className="text-xs leading-4 text-muted-foreground">{o.label}</div>
            <div data-testid={o.testid} className={cn('font-mono text-2xl leading-[30px] font-extrabold', o.hot ? 'text-risk-high-text' : o.tone === 'cursor' ? 'text-primary' : 'text-foreground')}>{o.value}</div>
            <div className="text-[11px] leading-[14px] text-muted-foreground">{o.sub}</div>
          </div>
        ))}
      </div>

      <section aria-label="Corte da rua" className={cn(panel, 'flex min-h-72 flex-col gap-2 px-[18px] py-4 lg:col-span-7 lg:min-h-0')}>
        <div className="flex items-center gap-2.5">
          <h2 className={cn(overline, 'flex-1')}>CORTE DA RUA · {cursorText}</h2>
          <button type="button" onClick={() => setPlaying((p) => !p)} className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs leading-4 font-bold text-primary-foreground">
            {playing ? <Pause className="size-3.5" fill="currentColor" aria-hidden="true" /> : <Play className="size-3.5" fill="currentColor" aria-hidden="true" />}
            {playing ? 'Pausar' : 'Reproduzir'}
          </button>
        </div>
        <StreetCut hMm={hNow} hcritMm={hcrit} rainMmH={cursor < n ? (rain[cursor] ?? 0) : 0} cursorText={cursorText} />
      </section>

      <section aria-label="Gráfico" className={cn(panel, 'flex min-h-72 flex-col gap-2 px-[18px] py-4 lg:col-span-5 lg:min-h-0')}>
        <h2 className={overline}>CHUVA × LÂMINA NA RUA ({n} H)</h2>
        <BucketChart rain={rain} hMm={hMm} capacityMmH={capacity} hcritMm={hcrit} cursor={cursor} />
      </section>

      <section aria-label="Leitura" className={cn(panel, 'grid gap-5 px-[18px] py-4 lg:col-span-12 lg:grid-cols-[1.3fr_1fr]')}>
        <div className="text-[13px] leading-[19px]">
          <strong>{verdictTitle}</strong>
          <br />
          <span className="text-muted-foreground">{verdictText}</span>
          {sim.nOutsideCurve > 0 && (
            <p role="status" className="mt-2 flex items-start gap-2 text-xs leading-4 text-warning">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {sim.nOutsideCurve} {sim.nOutsideCurve === 1 ? 'hora caiu' : 'horas caíram'} fora da curva cota-volume do terreno: nestas horas o valor é extrapolado e vale menos.
            </p>
          )}
        </div>
        <div className="font-mono text-xs leading-[18px] text-muted-foreground">
          C = <strong className="text-foreground">{fmt(sim.paramsUsed.C, 2)}</strong> · i_T = <strong className="text-foreground">{fmt(sim.paramsUsed.iT_mm_h)} mm/h</strong> · f = <strong className="text-foreground">{fmt(sim.paramsUsed.f)}</strong>
          <br />
          capacidade f·i_T = <strong className="text-foreground">{fmt(capacity)} mm/h</strong>
          <br />
          V = max(0, V + Q_in − min(q_p, V + Q_in)) · h = 1000·max(0, z − cota da rua)
          <p className="mt-1 font-sans text-[11px] leading-[14px]">Modelo {sim.model}, ilustrativo. Escala da curva {fmt(sim.paramsUsed.curve_scale, 2)}; snap {fmt(sim.paramsUsed.snap_m, 0)} m.</p>
        </div>
      </section>
    </section>
  );
};
