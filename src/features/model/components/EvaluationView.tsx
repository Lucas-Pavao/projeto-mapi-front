import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { IntervalPlot } from '@/components/charts/IntervalPlot';
import { formatRecife } from '@/features/map/utils/datetime';
import type { EvaluationResult, ModelEvaluation } from '../schemas/model.schema';

/** Número como veio do arquivo, com separador pt-BR. `digits` só controla casas decimais exibidas. */
const num = (v: number | null | undefined, digits = 3): string => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(v) ? 0 : digits, maximumFractionDigits: digits }));
const ic = (v: readonly [number, number] | undefined): string => (v ? `[${num(v[0])}; ${num(v[1])}]` : '—');

const Stat: React.FC<{ k: string; v: React.ReactNode; hint?: string }> = ({ k, v, hint }) => (
  <div className="rounded-lg border border-border bg-background p-3">
    <dt className="text-code text-muted-foreground">{k}</dt>
    <dd className="text-reading-lg text-foreground">{v}</dd>
    {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section aria-label={title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
    <h2 className="text-title text-foreground">{title}</h2>
    {children}
  </section>
);

/**
 * Mostra `result` de /api/model/evaluation. Cada número vem do JSON; os rótulos são os nomes dos campos
 * do arquivo. Nada é recalculado, arredondado para "melhor" nem completado.
 */
export const EvaluationView: React.FC<{ evaluation: ModelEvaluation & { headerSha256?: string | null }; result: EvaluationResult | null }> = ({ evaluation, result: r }) => {
  const shaMismatch = evaluation.headerSha256 != null && evaluation.headerSha256 !== evaluation.sha256;
  return (
    <div className="flex flex-col gap-4">
      <Section title="Origem do resultado">
        <dl className="grid gap-2 text-body sm:grid-cols-2">
          <div><dt className="text-caption text-muted-foreground">Arquivo</dt><dd className="break-all text-code text-foreground">{evaluation.source}</dd></div>
          <div><dt className="text-caption text-muted-foreground">Congelado em</dt><dd className="text-foreground">{evaluation.frozenAt ? formatRecife(evaluation.frozenAt) : 'data de congelamento não registrada'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-caption text-muted-foreground">SHA-256 do arquivo</dt><dd className="break-all text-code text-foreground">{evaluation.sha256}</dd></div>
        </dl>
        {shaMismatch && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-body text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            O hash do cabeçalho da resposta não bate com o do corpo. Não use estes números até conferir com a equipe.
          </p>
        )}
        <p className="text-caption text-muted-foreground">Números exibidos exatamente como no arquivo congelado; a tela não recalcula nada.</p>
      </Section>

      {!r ? (
        <Section title="Conteúdo (formato não reconhecido)">
          <p className="text-body text-muted-foreground">O resultado não tem o formato esperado; aqui está o JSON como chegou.</p>
          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-code text-foreground">{JSON.stringify(evaluation.result, null, 2)}</pre>
        </Section>
      ) : (
        <>
          {(r.class_h1 || r.class_h2) && (
            <Section title="Conclusão registrada no arquivo">
              <dl className="grid gap-3 sm:grid-cols-2">
                {r.class_h1 && <Stat k="class_h1" v={r.class_h1[0]} />}
                {r.class_h2 && <Stat k="class_h2" v={r.class_h2[0]} />}
              </dl>
            </Section>
          )}

          <Section title="Amostra">
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {r.n_pos_principal != null && <Stat k="n_pos_principal" v={num(r.n_pos_principal)} />}
              {r.n_pos_extra != null && <Stat k="n_pos_extra" v={num(r.n_pos_extra)} />}
              {r.n_neg != null && <Stat k="n_neg" v={num(r.n_neg)} />}
              {r.n_neg_bruto != null && <Stat k="n_neg_bruto" v={num(r.n_neg_bruto)} />}
              {r.episodios_principal != null && <Stat k="episodios_principal" v={num(r.episodios_principal)} />}
              {r.episodios_18 != null && <Stat k="episodios_18" v={num(r.episodios_18)} />}
              {r.dias_incompletos_avaliacao && <Stat k="dias_incompletos_avaliacao" v={num(r.dias_incompletos_avaliacao.length)} hint="dias" />}
            </dl>
          </Section>

          {(r.auc_B2 || r.auc_B3 || r.m1?.central) && (
            <Section title="AUC com intervalo (IC)">
              <IntervalPlot
                title="AUC e IC"
                rows={[
                  ...(r.auc_B2 ? [{ id: 'B2', label: 'auc_B2', value: r.auc_B2[0], lo: r.auc_B2[1][0], hi: r.auc_B2[1][1], colorClass: 'text-chart-2' }] : []),
                  ...(r.auc_B3 ? [{ id: 'B3', label: 'auc_B3', value: r.auc_B3[0], lo: r.auc_B3[1][0], hi: r.auc_B3[1][1], colorClass: 'text-chart-3' }] : []),
                  ...(r.m1?.central?.auc != null && r.m1.central.auc_ic ? [{ id: 'M1', label: 'm1.central', value: r.m1.central.auc, lo: r.m1.central.auc_ic[0], hi: r.m1.central.auc_ic[1], colorClass: 'text-chart-1' }] : []),
                ]}
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[26rem] text-left text-body">
                  <caption className="sr-only">AUC e intervalo de confiança</caption>
                  <thead><tr className="border-b border-border text-caption text-muted-foreground"><th scope="col" className="py-1 pr-3 font-medium">Campo</th><th scope="col" className="py-1 pr-3 font-medium">AUC</th><th scope="col" className="py-1 font-medium">IC</th></tr></thead>
                  <tbody>
                    {r.auc_B2 && <tr className="border-b border-border/60"><th scope="row" className="py-1 pr-3 text-code font-normal">auc_B2</th><td className="pr-3 text-reading">{num(r.auc_B2[0])}</td><td className="text-reading">{ic(r.auc_B2[1])}</td></tr>}
                    {r.auc_B3 && <tr className="border-b border-border/60"><th scope="row" className="py-1 pr-3 text-code font-normal">auc_B3</th><td className="pr-3 text-reading">{num(r.auc_B3[0])}</td><td className="text-reading">{ic(r.auc_B3[1])}</td></tr>}
                    {r.m1?.central && <tr className="border-b border-border/60"><th scope="row" className="py-1 pr-3 text-code font-normal">m1.central</th><td className="pr-3 text-reading">{num(r.m1.central.auc)}</td><td className="text-reading">{ic(r.m1.central.auc_ic)}</td></tr>}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {r.m1 && Object.keys(r.m1).length > 0 && (
            <Section title="M1: variações de parâmetros (sensibilidade)">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left text-body">
                  <caption className="sr-only">Resultado do M1 por variação de parâmetro</caption>
                  <thead>
                    <tr className="border-b border-border text-caption text-muted-foreground">
                      {['variação', 'auc', 'auc_ic', 'd_h1', 'd_h1_ic', 'cat_h1', 'd_h2', 'd_h2_ic', 'cat_h2'].map((h) => <th key={h} scope="col" className="py-1 pr-3 text-code font-normal">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(r.m1).map(([name, e]) => (
                      <tr key={name} data-m1={name} className="border-b border-border/60 align-top">
                        <th scope="row" className="py-1 pr-3 text-code font-normal">{name}</th>
                        <td className="pr-3 text-reading">{num(e.auc)}</td>
                        <td className="pr-3 text-reading">{ic(e.auc_ic)}</td>
                        <td className="pr-3 text-reading">{num(e.d_h1)}</td>
                        <td className="pr-3 text-reading">{ic(e.d_h1_ic)}</td>
                        <td className="pr-3 text-body">{e.cat_h1 ?? '—'}</td>
                        <td className="pr-3 text-reading">{num(e.d_h2)}</td>
                        <td className="pr-3 text-reading">{ic(e.d_h2_ic)}</td>
                        <td className="text-body">{e.cat_h2 ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {r.degenerado && (
            <Section title="degenerado">
              <dl className="grid gap-3 sm:grid-cols-3">
                {r.degenerado.alerta_M1a_em_N != null && <Stat k="alerta_M1a_em_N" v={num(r.degenerado.alerta_M1a_em_N)} />}
                {r.degenerado.S_zero_em_todos_positivos != null && <Stat k="S_zero_em_todos_positivos" v={r.degenerado.S_zero_em_todos_positivos ? 'verdadeiro' : 'falso'} />}
                {r.degenerado.S_max_N != null && <Stat k="S_max_N" v={num(r.degenerado.S_max_N)} />}
              </dl>
            </Section>
          )}

          {r.auc_todos && Object.keys(r.auc_todos).length > 0 && (
            <Section title="auc_todos">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-body">
                  <caption className="sr-only">AUC de todas as variantes</caption>
                  <thead><tr className="border-b border-border text-caption text-muted-foreground">{['variante', 'auc', 'ic', 'auc18', 'ic18'].map((h) => <th key={h} scope="col" className="py-1 pr-3 text-code font-normal">{h}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(r.auc_todos).map(([name, e]) => (
                      <tr key={name} className="border-b border-border/60">
                        <th scope="row" className="py-1 pr-3 text-code font-normal">{name}</th>
                        <td className="pr-3 text-reading">{num(e.auc)}</td><td className="pr-3 text-reading">{ic(e.ic)}</td><td className="pr-3 text-reading">{num(e.auc18)}</td><td className="text-reading">{ic(e.ic18)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {r.binarias && Object.keys(r.binarias).length > 0 && (
            <Section title="binarias">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-body">
                  <caption className="sr-only">Contagens binárias por variante</caption>
                  <thead><tr className="border-b border-border text-caption text-muted-foreground">{['variante', 'k14', 'ic14', 'k18', 'ic18', 'k4', 'kn', 'icn'].map((h) => <th key={h} scope="col" className="py-1 pr-3 text-code font-normal">{h}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(r.binarias).map(([name, e]) => (
                      <tr key={name} className="border-b border-border/60">
                        <th scope="row" className="py-1 pr-3 text-code font-normal">{name}</th>
                        <td className="pr-3 text-reading">{num(e.k14)}</td><td className="pr-3 text-reading">{ic(e.ic14)}</td><td className="pr-3 text-reading">{num(e.k18)}</td><td className="pr-3 text-reading">{ic(e.ic18)}</td><td className="pr-3 text-reading">{num(e.k4)}</td><td className="pr-3 text-reading">{num(e.kn)}</td><td className="text-reading">{ic(e.icn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
};
