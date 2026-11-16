import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { pctTxt } from '@/components/risk/thresholds';
import type { ModelCard } from '../schemas/modelCard.schema';
import type { ModelCardV3 } from '../schemas/modelCardV3.schema';

const panel = 'flex min-w-0 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4';
const overline = 'm-0 text-xs leading-4 font-bold uppercase tracking-[0.06em] text-muted-foreground';
const n = (v: number | null | undefined, d = 3) => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const MODEL = { logistica: 'Regressão logística', xgboost: 'XGBoost', arvore_rasa: 'Árvore rasa', regra_chuva3h: 'Regra: chuva de 3 h (contínua)' } as Record<string, string>;

/** v2 (em uso até 16/11) e v3 lado a lado. Tudo dos dois cartões estáticos; o aviso de dado sintético fica visível. */
export const CompareV2V3: React.FC<{ v2: ModelCard; v3: ModelCardV3 }> = ({ v2, v3 }) => {
  const prodV2 = v2.rows.find((r) => r.id === 'xgb' || r.name.includes('produção'));
  const h0 = v3.horizons.find((h) => h.hours === 0);
  const hp = v3.horizons.find((h) => h.hours === v3.horizonHours);
  const xH0 = v3.explanations['h0_acumulados_aninhados'], xH0w = v3.explanations['h0_janelas_disjuntas'];
  const xH6 = v3.explanations[`h${v3.horizonHours}_acumulados_aninhados`], xH6w = v3.explanations[`h${v3.horizonHours}_janelas_disjuntas`];
  const phys = v3.physical;
  const rows: Array<[string, string, string]> = [
    ['Modelo', `XGBoost (${v2.modelVersion})`, `${MODEL[v3.model] ?? v3.model} (${v3.modelVersion})`],
    ['O que prevê', 'Alaga nesta hora (sem antecedência)', `Alaga nas próximas ${v3.horizonHours} h`],
    ['Entradas de chuva', '5 acumulados aninhados (1, 3, 6, 12, 24 h)', '5 janelas disjuntas (0–1, 1–3, 3–6, 6–12, 12–24 h)'],
    ['Latitude e longitude', 'Sim', 'Não (removidas)'],
    ['Chuva ausente', 'Recusa (previsão indisponível)', 'Aceita e declara a ausência'],
    ['Probabilidade servida', 'Bruta', 'Calibrada e corrigida para a prevalência real'],
    ['Limiar moderado / alto', `${pctTxt(v2.thresholds.medium)} / ${pctTxt(v2.thresholds.high)}`, `${pctTxt(v3.thresholds.medium)} / ${pctTxt(v3.thresholds.high)}`],
    ['Como os limiares saíram', 'Recall sobre rótulo sintético na validação', 'Orçamento: 50 e 10 dias de alerta por ponto por ano'],
    ['PR-AUC, teste, alaga agora (H = 0)', n(prodV2?.prAuc), `${n(h0?.test?.pr_auc)} com lacunas; ${n(h0?.testComplete?.pr_auc)} sem`],
    [`PR-AUC, teste, H = ${v3.horizonHours}`, '—', n(hp?.test?.pr_auc)],
    [`ECE, teste, H = ${v3.horizonHours}`, '—', `${n(hp?.test?.ece)} bruta; ${n(hp?.testCalibrated?.ece)} calibrada`],
  ];
  return (
    <div className="flex flex-col gap-3.5" data-testid="compare-v2-v3">
      <p role="note" className="m-0 flex items-center gap-2.5 rounded-xl border-[1.5px] border-warning bg-warning/10 px-4 py-2.5 text-[13px] leading-[18px]">
        <TriangleAlert className="size-[18px] shrink-0 text-warning" aria-hidden="true" />
        <span><strong className="text-warning">{v3.tag}.</strong> Os dois modelos foram treinados com rótulo de fórmula; nenhum número é desempenho em alagamento real. As PR-AUC de H = 0 do v2 e do v3 vêm de amostras diferentes.</span>
      </p>
      <section aria-label="v2 e v3" className={panel}>
        <h2 className={overline}>v2 × v3</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] leading-[18px]">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1.5 pr-3 font-bold"> </th><th className="py-1.5 pr-3 font-bold">v2</th><th className="py-1.5 font-bold">v3 (em produção)</th></tr></thead>
            <tbody>{rows.map(([k, a, b]) => <tr key={k} className="border-t border-border align-top"><th scope="row" className="py-1.5 pr-3 text-left font-semibold">{k}</th><td className="py-1.5 pr-3">{a}</td><td className="py-1.5">{b}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <section aria-label="Alertas e eventos" className={panel}>
          <h2 className={overline}>v3 · alertas no teste, série contínua, H = {v3.horizonHours}</h2>
          {hp && (['medium', 'high'] as const).map((lvl) => {
            const e = hp.events[lvl];
            return (
              <p key={lvl} className="m-0 text-[13px] leading-[18px]">
                <strong>{lvl === 'medium' ? 'Moderado' : 'Alto'}:</strong> {n(e.alertDaysPerPointYear, 1)} dias de alerta por ponto por ano;
                {' '}detecta {pctTxt(e.eventRecall)} dos eventos ({pctTxt(e.rainEventRecall)} dos que ocorrem em chuva);
                {' '}antecedência mediana <strong>{e.leadMedianH == null ? '—' : `${n(e.leadMedianH, 0)} h`}</strong>.
              </p>
            );
          })}
          <p className="m-0 text-xs leading-[17px] text-muted-foreground">Antecedência de 0 h: com chuva e maré só da hora atual, o alerta sai quando o evento começa. Sem previsão de chuva como entrada, o modelo não antecipa.</p>
        </section>
        <section aria-label="Resultados negativos" className={panel}>
          <h2 className={overline}>Resultados negativos do v3</h2>
          <p className="m-0 text-[13px] leading-[18px]"><strong>Janelas disjuntas não melhoraram as explicações.</strong> Concordância SHAP × LIME (Jaccard do top-5): {n(xH0?.jaccard, 2)} → {n(xH0w?.jaccard, 2)} em H = 0; {n(xH6?.jaccard, 2)} → {n(xH6w?.jaccard, 2)} em H = {v3.horizonHours}. Estabilidade do LIME: {n(xH6?.limeStability, 2)} → {n(xH6w?.limeStability, 2)}.</p>
          <p className="m-0 text-[13px] leading-[18px]"><strong>Entradas físicas não ajudaram.</strong> PR-AUC de teste {n(phys['fisico']?.testPrAuc)} com pico de 10 min, tendência da maré e umidade do solo, contra {n(phys['fisico_base']?.testPrAuc)} sem elas (mesmo rótulo).</p>
          <p className="m-0 text-xs leading-[17px] text-muted-foreground">Mesma logística, mesmo dataset; só as entradas mudam.</p>
        </section>
      </div>
      {v3.attribution && <p className="m-0 text-[11px] text-muted-foreground">{v3.attribution}.</p>}
    </div>
  );
};
