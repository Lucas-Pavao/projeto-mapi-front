import React, { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { pctTxt, riskOf } from '@/components/risk/thresholds';
import { cn } from '@/lib/utils';
import type { ModelCard } from '../schemas/modelCard.schema';
import { thresholdReason } from '@/components/risk/provenance';

const panel = 'flex min-h-0 min-w-0 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4';
const overline = 'm-0 text-xs leading-4 font-bold uppercase tracking-[0.06em] text-muted-foreground';
const n = (v: number, d = 3) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
/** Posição na escala de raiz quadrada (0–100%). */
const sqrtPos = (v: number) => `${(Math.sqrt(Math.max(0, Math.min(1, v))) * 100).toFixed(2)}%`;
const sg = (v: number, d = 3) => `${v >= 0 ? '+' : '−'}${n(Math.abs(v), d)}`;

type Metric = 'prAuc' | 'rocAuc' | 'brier';
const METRICS: ReadonlyArray<{ id: Metric; label: string; name: string; note: string }> = [
  { id: 'prAuc', label: 'PR-AUC', name: 'PR-AUC (maior é melhor)', note: 'Maior é melhor. Com poucos positivos, "nunca alaga" já tem PR-AUC próxima da taxa de base: compare sempre com os baselines.' },
  { id: 'rocAuc', label: 'ROC-AUC', name: 'ROC-AUC (maior é melhor)', note: 'Maior é melhor. 0,5 é o acaso. Mede a ordenação, não a calibração das probabilidades.' },
  { id: 'brier', label: 'Brier', name: 'Brier (menor é melhor)', note: 'Menor é melhor. Erro quadrático da probabilidade. A versão calibrada só muda o Brier, não a ordenação.' },
];

/** Campos da resposta da previsão (ADR 0007, emenda 2) que a tela do modelo anterior mostra: chave e valor, como na referência. Valores do cartão. */
const fields = (card: ModelCard): ReadonlyArray<[string, string]> => [
  ['modelVersion', `${card.modelVersion} (antes: unversioned)`],
  ['riskThresholds', `{medium: ${n(card.thresholds.medium, 4)}, high: ${n(card.thresholds.high, 4)}, source: metadata}`],
  ['rainSource', card.rainSource ?? '—'],
  ['trainingData', card.trainingData],
  ['syntheticWarning', 'texto obrigatório na tela quando o treino é sintético'],
  ['contributors', '3 maiores SHAP, em p.p., com value e unit'],
];

const Baselines: React.FC<{ card: ModelCard }> = ({ card }) => {
  const [metric, setMetric] = useState<Metric>('prAuc');
  const m = METRICS.find((x) => x.id === metric) as (typeof METRICS)[number];
  const max = Math.max(...card.rows.map((r) => r[metric]), 1e-9);
  return (
    <section aria-label="Comparação com os baselines" className={cn(panel, 'lg:col-span-7')}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={overline}>Teste · {m.label}</h2>
        <div role="radiogroup" aria-label="Métrica" className="flex gap-0.5 rounded-[10px] bg-muted p-[3px]">
          {METRICS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={metric === x.id} onClick={() => setMetric(x.id)} className={cn('h-7 cursor-pointer rounded-lg border-0 px-2.5 text-xs font-bold text-foreground', metric === x.id ? 'bg-card' : 'bg-transparent')}>{x.label}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-around gap-1.5">
        {[...card.rows].sort((x, y) => (metric === 'brier' ? x[metric] - y[metric] : y[metric] - x[metric])).map((r) => {
          const prod = r.id === 'xgb_v2';
          return (
            <div key={r.id} data-row={r.id} className="grid grid-cols-[minmax(0,190px)_1fr_56px] items-center gap-2.5">
              <span className={cn('text-[13px]', prod ? 'font-extrabold' : 'text-muted-foreground')}>{r.name}</span>
              <span className="h-3.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${((r[metric] / max) * 100).toFixed(1)}%`, background: prod ? 'var(--primary)' : 'var(--chart-3)' }} /></span>
              <span className="text-right font-mono text-[13px] font-bold">{n(r[metric])}</span>
            </div>
          );
        })}
      </div>
      <p className="m-0 text-xs leading-[17px] text-muted-foreground">{m.note}</p>
    </section>
  );
};

const Probe: React.FC<{ card: ModelCard }> = ({ card }) => {
  const t = card.thresholds;
  const [p, setP] = useState(Math.round(t.high * 100));
  const prob = p / 100;
  const level = riskOf(prob, t);
  return (
    <section aria-label="Limiares de risco" className={cn(panel, 'lg:col-span-5')}>
      <h2 className={overline}>Limiares (metadata.json) · teste uma probabilidade</h2>
      <label className="flex flex-col gap-1">
        <span className="flex justify-between text-[13px] font-bold">Probabilidade do modelo<span className="font-mono" data-testid="probe-p">{pctTxt(prob)}</span></span>
        <input type="range" min={0} max={100} step={1} value={p} onChange={(e) => setP(Number(e.target.value))} className="m-0 w-full" />
      </label>
      {/* Escala de raiz quadrada (protótipo): com limiares de 1,6% e 24,4%, na escala linear a faixa baixa some.
          Os rótulos ficam exatamente nas fronteiras das cores. */}
      <div className="relative flex h-[34px] overflow-hidden rounded-lg" aria-hidden="true">
        <span style={{ width: sqrtPos(t.medium) }} className="bg-risk-low" /><span style={{ width: `calc(${sqrtPos(t.high)} - ${sqrtPos(t.medium)})` }} className="bg-risk-moderate" /><span className="flex-1 bg-risk-high" />
        <span data-testid="probe-marker" className="absolute inset-y-0 -ml-px w-[3px] bg-foreground" style={{ left: sqrtPos(prob) }} />
      </div>
      <div className="relative h-4 font-mono text-[11px] text-muted-foreground" data-testid="probe-scale">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/2" style={{ left: sqrtPos(t.medium) }}>{pctTxt(t.medium)}</span>
        <span className="absolute -translate-x-1/2" style={{ left: sqrtPos(t.high) }}>{pctTxt(t.high)}</span>
        <span className="absolute right-0">100%</span>
      </div>
      <p className="m-0 text-[11px] text-muted-foreground">escala de raiz quadrada</p>
      <div className="flex items-center gap-2.5" data-testid="probe-result">
        <RiskBadge level={level} probability={prob} />
        <span className="text-xs text-muted-foreground">{thresholdReason(level, prob, t)}</span>
      </div>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs leading-4">
        <dt className="font-bold">Moderado ≥ {pctTxt(t.medium)}</dt><dd className="m-0 text-muted-foreground">{t.criteria?.medium ?? '—'}</dd>
        <dt className="font-bold">Alto ≥ {pctTxt(t.high)}</dt><dd className="m-0 text-muted-foreground">{t.criteria?.high ?? '—'}</dd>
        <dt className="font-bold">Calibração</dt>
        <dd className="m-0 text-muted-foreground">{card.calibration.used ? 'aplicada' : 'não aplicada'}{card.calibration.valEceRaw != null ? `: ECE de validação ${n(card.calibration.valEceRaw)}` : ''}{card.calibration.criterion ? ` (critério: ${card.calibration.criterion})` : ''}</dd>
      </dl>
    </section>
  );
};

const Ablations: React.FC<{ card: ModelCard }> = ({ card }) => {
  const lo = Math.min(0, ...card.ablations.map((a) => a.lo));
  const hi = Math.max(0, ...card.ablations.map((a) => a.hi));
  const pos = (v: number) => `${(((v - lo) / (hi - lo || 1)) * 100).toFixed(1)}%`;
  return (
    <section aria-label="Ablações" className={cn(panel, 'lg:col-span-4')}>
      <h2 className={overline}>Ablações · ΔPR-AUC com IC 95%</h2>
      <div className="flex flex-1 flex-col justify-center gap-3.5">
        {card.ablations.map((a) => {
          const crosses = a.lo < 0 && a.hi > 0;
          return (
            <div key={a.label} data-ablation className="flex flex-col gap-1">
              <div className="flex justify-between gap-2 text-[13px]"><span>{a.label}</span><span className="font-mono font-bold">{sg(a.delta)}</span></div>
              <div className="relative h-3.5">
                <span className="absolute inset-y-0 w-px bg-muted-foreground" style={{ left: pos(0) }} />
                <span className={cn('absolute top-[5px] h-1 rounded-full', crosses ? 'bg-muted-foreground' : a.delta > 0 ? 'bg-success' : 'bg-warning')} style={{ left: pos(a.lo), width: `${(((a.hi - a.lo) / (hi - lo || 1)) * 100).toFixed(1)}%` }} />
                <span className="absolute top-px size-3 -ml-1.5 rounded-full border-2 border-card bg-foreground" style={{ left: pos(a.delta) }} />
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">[{sg(a.lo)}; {sg(a.hi)}]{crosses ? ' · cruza o zero' : ''}</span>
            </div>
          );
        })}
      </div>
      <p className="m-0 text-xs leading-[17px] text-muted-foreground">Intervalos de bootstrap sobre o teste. Δ positivo favorece o primeiro termo; intervalo que cruza o zero não separa os dois.</p>
    </section>
  );
};

const Xai: React.FC<{ card: ModelCard }> = ({ card }) => {
  const x = card.xai;
  const tiles: Array<[string, string]> = [[n(x.jaccard, 2), 'Jaccard top-5 SHAP × LIME'], [n(x.spearman, 2), 'Spearman SHAP × LIME'], [n(x.lime10, 2), 'LIME: estabilidade (10 sementes)'], [n(x.planBSpearman, 2), 'Spearman, plano B'], [n(x.delShap, 3), 'Deleção por SHAP (Δ)'], [n(x.delLime, 3), 'Deleção por LIME (Δ)'], [n(x.delRandom, 3), 'Deleção aleatória (Δ)']];
  return (
    <section aria-label="Explicações" className={cn(panel, 'lg:col-span-4')}>
      <h2 className={overline}>Explicações (SHAP × LIME)</h2>
      <ol className="m-0 list-none p-0 pl-2 text-[13px] leading-5">{x.top5.map((t) => <li key={t}>{t}</li>)}</ol>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(([v, l]) => <div key={l} className="rounded-[10px] bg-muted px-2.5 py-2"><div className="font-mono text-base font-bold leading-5">{v}</div><div className="text-[11px] leading-[14px] text-muted-foreground">{l}</div></div>)}
      </div>
    </section>
  );
};

/** Tela do modelo em produção (xgb_v2): tudo lido do cartão estático; o aviso de rótulo sintético fica sempre visível. */
export const ModelV2View: React.FC<{ card: ModelCard }> = ({ card }) => (
  <div className="flex flex-1 flex-col gap-3.5" data-testid="model-v2">
    <p role="note" data-testid="synthetic-warning" className="m-0 flex items-center gap-2.5 rounded-xl border-[1.5px] border-warning bg-warning/10 px-4 py-2.5 text-[13px] leading-[18px]">
      <TriangleAlert className="size-[18px] shrink-0 text-warning" aria-hidden="true" />
      <span><strong className="text-warning">{card.tag ?? 'DADOS SINTÉTICOS'}.</strong> Nenhum número desta tela é desempenho em alagamento real. O rótulo veio de uma fórmula de chuva medida e maré ({n(card.synthetic.n, 0)} linhas, {pctTxt(card.synthetic.positiveRate)} positivas, semente {card.synthetic.seed}).</span>
    </p>
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
      <Baselines card={card} />
      <Probe card={card} />
      <Ablations card={card} />
      <Xai card={card} />
      <section aria-label="Contrato da previsão" className={cn(panel, 'lg:col-span-4')}>
        <h2 className={overline}>O que a previsão traz agora</h2>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs leading-4">
          {fields(card).map(([k, v]) => <React.Fragment key={k}><dt className="font-mono text-primary">{k}</dt><dd className="m-0 text-muted-foreground">{v}</dd></React.Fragment>)}
        </dl>
        <p className="m-0 mt-auto text-[11px] leading-[15px] text-muted-foreground">ADR 0007 emenda 2: a proveniência é gravada em flood_predictions.model_info (V26), então o GET nunca devolve risco sintético sem etiqueta.</p>
        {card.sources && <p className="m-0 text-[11px] leading-[15px] text-muted-foreground">Origem: {Object.keys(card.sources).length} arquivos com SHA-256 registrado em <span className="font-mono">model_card.json</span>.{card.attribution ? ` ${card.attribution}.` : ''}</p>}
      </section>
    </div>
  </div>
);
