import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { ExperimentalBadge } from '@/components/risk/ExperimentalBadge';
import { formatRecife } from '@/features/map/utils/datetime';
import { cn } from '@/lib/utils';
import type { EvaluationResult, ModelEvaluation } from '../schemas/model.schema';
import { AucRows, type AucRow } from './AucRows';
import { signed } from '../utils/format';
import { DeltaPlot } from './DeltaPlot';

/** Número como veio do arquivo, com separador pt-BR. `digits` só controla casas decimais exibidas. */
const num = (v: number | null | undefined, digits = 3): string => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(v) ? 0 : digits, maximumFractionDigits: digits }));
const ic = (v: readonly [number, number] | undefined): string => (v ? `[${num(v[0])}; ${num(v[1])}]` : '—');

const panel = 'flex min-h-0 flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4';
const overline = 'm-0 text-xs leading-4 font-bold tracking-[0.06em] text-muted-foreground';
const COLORS = ['var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)'];

type Set = 'principal' | 'secundaria';

/** Cabeçalho da tela: título, origem e, com dados, a conclusão registrada e o conjunto de positivos. */
export const ModelHeader: React.FC<{ subtitle: string; badge?: string; children?: React.ReactNode }> = ({ subtitle, badge, children }) => (
  <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3.5 lg:h-[72px] lg:py-0">
    <div className="min-w-0 flex-1">
      <h1 className="m-0 text-[22px] leading-7 font-extrabold text-foreground">Desempenho do modelo</h1>
      <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">{subtitle}</p>
    </div>
    {badge && <span className="inline-flex h-[30px] items-center rounded-full border-[1.5px] border-warning px-3 text-xs font-bold text-warning">{badge}</span>}
    {children}
  </header>
);

/**
 * Mostra `result` de /api/model/evaluation. Cada número vem do JSON; os rótulos são os nomes do arquivo.
 * Nada é recalculado, arredondado para "melhor" nem completado.
 */
export const EvaluationView: React.FC<{ evaluation: ModelEvaluation & { headerSha256?: string | null }; result: EvaluationResult | null }> = ({ evaluation, result: r }) => {
  const shaMismatch = evaluation.headerSha256 != null && evaluation.headerSha256 !== evaluation.sha256;
  const [set, setSet] = useState<Set>('principal');
  const [sel, setSel] = useState<string>('');

  const principal = useMemo<AucRow[]>(() => {
    if (!r) return [];
    const rows: AucRow[] = [];
    if (r.m1?.central?.auc != null && r.m1.central.auc_ic) rows.push({ id: 'M1a', name: 'M1a · balde (central)', auc: r.m1.central.auc, lo: r.m1.central.auc_ic[0], hi: r.m1.central.auc_ic[1], color: 'var(--primary)' });
    if (r.auc_B3) rows.push({ id: 'B3', name: 'B3 · chuva horária máx. (IDF)', auc: r.auc_B3[0], lo: r.auc_B3[1][0], hi: r.auc_B3[1][1], color: 'var(--chart-3)' });
    if (r.auc_B2) rows.push({ id: 'B2', name: 'B2 · normal mensal INMET', auc: r.auc_B2[0], lo: r.auc_B2[1][0], hi: r.auc_B2[1][1], color: 'var(--muted-foreground)' });
    Object.entries(r.auc_todos ?? {}).forEach(([k, e], i) => {
      if (e.auc != null && e.ic) rows.push({ id: `t:${k}`, name: k, auc: e.auc, lo: e.ic[0], hi: e.ic[1], color: COLORS[i % COLORS.length], excluiZeroCinco: e.exclui_05 });
    });
    return rows;
  }, [r]);
  const secundaria = useMemo<AucRow[]>(() => {
    if (!r) return [];
    return Object.entries(r.auc_todos ?? {}).flatMap(([k, e], i) => (e.auc18 != null && e.ic18 ? [{ id: `t:${k}`, name: k, auc: e.auc18, lo: e.ic18[0], hi: e.ic18[1], color: COLORS[i % COLORS.length], excluiZeroCinco: undefined }] : []));
  }, [r]);

  if (!r) {
    return (
      <>
        <ModelHeader subtitle="Avaliação F1 pré-registrada · formato do arquivo não reconhecido" />
        <section aria-label="Conteúdo (formato não reconhecido)" className={panel}>
          <h2 className={overline}>CONTEÚDO (FORMATO NÃO RECONHECIDO)</h2>
          <p className="m-0 text-[13px] leading-[18px] text-muted-foreground">O resultado não tem o formato esperado; aqui está o JSON como chegou.</p>
          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-code text-foreground">{JSON.stringify(evaluation.result, null, 2)}</pre>
        </section>
      </>
    );
  }

  const rows = set === 'principal' ? principal : secundaria;
  const current = rows.find((x) => x.id === sel) ?? rows[0];
  const nPrincipal = r.n_pos_principal;
  const nSecundaria = r.n_pos_principal != null && r.n_pos_extra != null ? r.n_pos_principal + r.n_pos_extra : undefined;
  const nPos = set === 'principal' ? nPrincipal : nSecundaria;
  const h1 = r.class_h1?.[0];
  const h2 = r.class_h2?.[0];
  const c = r.m1?.central;
  const crossesZero = c?.d_h1_ic != null && c.d_h1_ic[0] < 0 && c.d_h1_ic[1] > 0;
  const bins = Object.entries(r.binarias ?? {}).flatMap(([k, e]) => [
    ...(e.k14 != null && nPrincipal != null ? [{ v: `${num(e.k14)}/${num(nPrincipal)}`, l: `recall ${k}` }] : []),
    ...(e.kn != null && r.n_neg != null ? [{ v: `${num(e.kn)}/${num(r.n_neg)}`, l: `alertas falsos ${k}` }] : []),
  ]).slice(0, 3);
  const dg = r.degenerado;
  const sample: Array<[string, number | undefined]> = [
    ['n_pos_principal', r.n_pos_principal], ['n_pos_extra', r.n_pos_extra], ['n_neg', r.n_neg], ['n_neg_bruto', r.n_neg_bruto],
    ['episodios_principal', r.episodios_principal], ['episodios_18', r.episodios_18],
    ['dias_incompletos_avaliacao', r.dias_incompletos_avaliacao?.length],
  ];

  return (
    <>
      <ModelHeader
        subtitle="Avaliação F1 pré-registrada · números exatamente como no arquivo congelado, sem recálculo"
        badge={h1 || h2 ? [h1 ? `H1 ${h1}` : null, h2 ? `H2 ${h2}` : null].filter(Boolean).join(' · ') : undefined}
      >
        {rows.length > 0 && (
          <div role="radiogroup" aria-label="Conjunto de positivos" className="flex gap-0.5 rounded-[10px] bg-muted p-1">
            {([['principal', nPrincipal, 'principal'], ['secundaria', nSecundaria, 'secundária']] as const).map(([v, n, l]) => (
              <button key={v} type="button" role="radio" aria-checked={set === v} disabled={(v === 'principal' ? principal : secundaria).length === 0} onClick={() => setSet(v)} className={cn('h-8 rounded-lg border-0 px-3 text-xs leading-4 font-bold text-foreground disabled:opacity-50', set === v ? 'bg-card' : 'bg-transparent')}>
                {n != null ? `${num(n)} positivos (${l})` : `positivos (${l})`}
              </button>
            ))}
          </div>
        )}
      </ModelHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-2">
        {rows.length > 0 && (
          <section aria-label="AUC com intervalo (IC)" className={cn(panel, 'min-h-[22rem] lg:col-span-7 lg:min-h-0')}>
            <div className="flex items-baseline justify-between">
              <h2 className={overline}>AUC E IC 95%{nPos != null && r.n_neg != null ? ` (${num(nPos)} × ${num(r.n_neg)} DIAS)` : ''}</h2>
              <span className="text-xs text-muted-foreground">clique numa linha</span>
            </div>
            <AucRows rows={rows} selected={current?.id ?? ''} onSelect={setSel} />
            {current && (
              <p aria-live="polite" className="m-0 rounded-[10px] bg-muted px-3 py-2.5 text-[13px] leading-[18px]">
                <strong>{current.name}:</strong> AUC {num(current.auc)} [{num(current.lo)}; {num(current.hi)}]{current.excluiZeroCinco != null && ` — IC ${current.excluiZeroCinco ? 'exclui' : 'não exclui'} 0,5`}
              </p>
            )}
            <table className="sr-only">
              <caption>AUC e intervalo de confiança</caption>
              <thead><tr><th scope="col">Campo</th><th scope="col">AUC</th><th scope="col">IC</th></tr></thead>
              <tbody>{rows.map((x) => <tr key={x.id}><th scope="row">{x.name}</th><td>{num(x.auc)}</td><td>[{num(x.lo)}; {num(x.hi)}]</td></tr>)}</tbody>
            </table>
          </section>
        )}

        {c && c.d_h1 != null && c.d_h1_ic && (
          <section aria-label="Hipótese H1" className={cn(panel, 'lg:col-span-5')}>
            <h2 className={overline}>H1 · M1a É MELHOR QUE A CLIMATOLOGIA (B2)?</h2>
            <div className="flex items-baseline gap-2.5"><span className="font-mono text-[34px] leading-10 font-extrabold">ΔAUC {signed(c.d_h1)}</span><span className="font-mono text-sm font-semibold text-muted-foreground">[{signed(c.d_h1_ic[0])}; {signed(c.d_h1_ic[1])}]</span></div>
            <DeltaPlot value={c.d_h1} lo={c.d_h1_ic[0]} hi={c.d_h1_ic[1]} />
            <p className="m-0 text-[13px] leading-[19px]">
              {crossesZero ? <>O intervalo <strong>contém o zero</strong> (por {num(Math.min(Math.abs(c.d_h1_ic[0]), Math.abs(c.d_h1_ic[1])))}). </> : <>O intervalo <strong>não contém o zero</strong>. </>}
              {c.cat_h1 && <>Pelo protocolo: {c.cat_h1}. </>}
              {dg?.S_zero_em_todos_positivos && <>Além disso, <strong>degenerada</strong>: o balde nunca transbordou (S = 0 em todos os positivos), então o AUC do M1a vem só da chuva horária máxima. </>}
              {h2 && <>H2: {h2}.</>}
            </p>
            {bins.length > 0 && (
              <div className="mt-auto grid grid-cols-3 gap-2">
                {bins.map((b) => (
                  <div key={b.l} className="rounded-[10px] bg-muted p-2.5"><div className="font-mono text-base leading-5 font-bold">{b.v}</div><div className="text-[11px] text-muted-foreground">{b.l}</div></div>
                ))}
              </div>
            )}
          </section>
        )}

        {dg && (
          <section aria-label="Por que degenerou" className={cn(panel, 'lg:col-span-4')}>
            <h2 className={overline}>POR QUE O BALDE NUNCA TRANSBORDOU</h2>
            <dl className="m-0 flex flex-1 flex-col justify-center gap-3">
              {dg.alerta_M1a_em_N != null && <div className="flex justify-between text-[13px]"><dt>Alertas do M1a nos dias sem ocorrência</dt><dd className="m-0 font-mono text-sm font-bold">{num(dg.alerta_M1a_em_N)}</dd></div>}
              {dg.S_zero_em_todos_positivos != null && <div className="flex justify-between text-[13px]"><dt>S = 0 em todos os positivos</dt><dd className="m-0 font-mono text-sm font-bold">{dg.S_zero_em_todos_positivos ? 'verdadeiro' : 'falso'}</dd></div>}
              {dg.S_max_N != null && <div className="flex justify-between text-[13px]"><dt>S máximo nos dias sem ocorrência</dt><dd className="m-0 font-mono text-sm font-bold">{num(dg.S_max_N)}</dd></div>}
            </dl>
            <p className="m-0 text-xs leading-[17px] text-muted-foreground">Sem transbordamento o modelo só repete a ordem da chuva. Para exercitar o modelo é preciso pluviômetro com hora confiável. <Link to="/modelo/simulador" className="text-primary underline hover:text-foreground">Testar no simulador</Link></p>
          </section>
        )}

        {r.m1 && Object.keys(r.m1).length > 0 && (
          <section aria-label="M1: variações de parâmetros (sensibilidade)" className={cn(panel, 'lg:col-span-5')}>
            <h2 className={overline}>M1: VARIAÇÕES DE PARÂMETROS</h2>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[30rem] text-left text-xs">
                <caption className="sr-only">Resultado do M1 por variação de parâmetro</caption>
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {['variação', 'auc', 'auc_ic', 'd_h1', 'cat_h1', 'cat_h2'].map((h) => <th key={h} scope="col" className="py-1 pr-2 font-mono font-normal">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(r.m1).map(([name, e]) => (
                    <tr key={name} data-m1={name} className="border-b border-border/60 align-top">
                      <th scope="row" className="py-1 pr-2 font-mono font-normal">{name}</th>
                      <td className="pr-2 font-mono">{num(e.auc)}</td>
                      <td className="pr-2 font-mono">{ic(e.auc_ic)}</td>
                      <td className="pr-2 font-mono">{num(e.d_h1)}</td>
                      <td className="pr-2">{e.cat_h1 ?? '—'}</td>
                      <td>{e.cat_h2 ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section aria-label="Amostra e origem" className={cn(panel, 'lg:col-span-3', !dg && !(r.m1 && Object.keys(r.m1).length > 0) && 'lg:col-span-12')}>
          <h2 className={overline}>AMOSTRA E ORIGEM</h2>
          <div aria-label="Amostra" role="group" className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            <dl className="m-0 flex flex-col gap-1 text-xs">
              {sample.filter(([, v]) => v != null).map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="font-mono text-muted-foreground">{k}</dt><dd className="m-0 font-mono font-bold">{num(v)}</dd></div>)}
              <div className="mt-1"><dt className="text-muted-foreground">Arquivo</dt><dd className="m-0 break-all font-mono">{evaluation.source}</dd></div>
              <div><dt className="text-muted-foreground">Congelado em</dt><dd className="m-0">{evaluation.frozenAt ? formatRecife(evaluation.frozenAt) : 'data de congelamento não registrada'}</dd></div>
              <div><dt className="text-muted-foreground">SHA-256</dt><dd className="m-0 break-all font-mono text-[11px]">{evaluation.sha256}</dd></div>
            </dl>
          </div>
          {shaMismatch && (
            <p role="alert" className="m-0 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              O hash do cabeçalho da resposta não bate com o do corpo. Não use estes números até conferir com a equipe.
            </p>
          )}
          <ExperimentalBadge />
        </section>
      </div>
    </>
  );
};
