import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { SyntheticWarning } from '@/components/risk/SyntheticWarning';
import { pctTxt } from '@/components/risk/thresholds';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { contributorRows } from '@/features/points/utils/contributors';
import { candidateStatus, candidateValue, distanceText, ROLE_TAG } from '@/features/points/utils/rainCandidates';
import type { RainCandidates } from '@/features/points/schemas/rain-candidates.schema';
import type { PredictionSummary } from '@/features/points/schemas/prediction.schema';
import { cn } from '@/lib/utils';
import type { FloodPointResponseDTO } from '../../types';
import { ANALYSIS_TABS, TAB_LABEL, inputTiles, type AnalysisTab } from '../utils/analysis';
import { isUnknownState, meaningOf, pointCardState, reasonOf } from '../utils/pointView';
import { PointProbabilityChart } from './PointProbabilityChart';

interface Props {
  point: FloodPointResponseDTO;
  series: readonly PredictionSummary[];
  rain?: RainCandidates;
  now: number;
  tab: AnalysisTab;
  onTab: (t: AnalysisTab) => void;
  onClose?: () => void;
  /** Candidata da chuva do ponto: abre o card da estação ao lado. */
  onOpenStation?: (stationId: string) => void;
}

const H3: React.FC<React.PropsWithChildren> = ({ children }) => <h3 className="m-0 text-[11px] font-extrabold leading-[14px] tracking-[.06em] text-muted-foreground">{children}</h3>;

const EDGE: Record<string, string> = { HIGH: 'border-t-risk-high', MEDIUM: 'border-t-risk-moderate', LOW: 'border-t-risk-low', UNKNOWN: 'border-t-risk-unknown-edge' };

/** Painel lateral de 480 px com a análise completa do ponto: Por quê, Entradas e Origem. */
export const AnalysisPanel: React.FC<Props> = ({ point, series, rain, now, tab, onTab, onClose, onOpenStation }) => {
  const p = point.floodPrediction;
  const state = pointCardState(p);
  const unknown = isUnknownState(state);
  const level = p?.riskLevel ?? 'UNKNOWN';
  const used = rain?.candidates.find((c) => c.stationId === rain.usedStationId);
  const reason = reasonOf(state, p, used?.name ?? null);
  const imputed = p?.imputedFeatures ?? [];
  const imputedIds = new Set(imputed.map((i) => i.featureId));
  const rows = contributorRows(p?.contributors, 3, imputed);
  return (
    <aside role="dialog" aria-label={`Análise completa de ${point.name}`} data-testid="analysis-panel"
      className={cn('flex h-full w-[480px] max-w-full flex-col border-l border-t-4 border-border bg-card text-foreground shadow-elevation-overlay', EDGE[level] ?? EDGE.UNKNOWN, unknown && '[border-top-style:dashed]')}>
      <header className="flex flex-col gap-2 border-b border-border px-[18px] pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold tracking-[.06em] text-muted-foreground">ANÁLISE COMPLETA</span>
          {onClose && <button type="button" onClick={onClose} aria-label="Fechar análise" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" aria-hidden="true" /></button>}
        </div>
        <RiskBadge level={level} probability={p?.floodProbability} className="self-start" />
        <div>
          <p className="m-0 text-xl font-extrabold leading-[26px]">{point.name}</p>
          <p className="m-0 text-xs leading-4 text-muted-foreground">{point.municipality ?? 'Recife'} · {unknown ? 'sem previsão válida agora' : `emitida ${formatHoraCurta(p?.issuedAt) ?? '—'} · válida até ${formatHoraCurta(p?.validUntil) ?? '—'}`}</p>
        </div>
        <div role="tablist" aria-label="Seções da análise" className="flex gap-0.5 rounded-[10px] bg-muted p-[3px]">
          {ANALYSIS_TABS.map((t) => (
            <button key={t} id={`analysis-tab-${t}`} type="button" role="tab" aria-selected={tab === t} aria-controls="analysis-body" onClick={() => onTab(t)}
              className={cn('h-[30px] flex-1 cursor-pointer rounded-lg border-0 text-xs font-bold text-foreground', tab === t ? 'bg-card' : 'bg-transparent')}>{TAB_LABEL[t]}</button>
          ))}
        </div>
      </header>

      <div id="analysis-body" role="tabpanel" aria-labelledby={`analysis-tab-${tab}`} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-[18px] py-3.5">
        {tab === 'why' && (
          <>
            {!unknown && <SyntheticWarning prediction={p} className="rounded-[10px] px-2.5 py-2 text-xs leading-[17px]" />}
            <section className="flex flex-col gap-1.5">
              <H3>POR QUE ESTE NÍVEL</H3>
              <p className="m-0 text-sm leading-5">{meaningOf(state)}</p>
              <p data-testid="analysis-reason" className="m-0 rounded-lg bg-muted px-2.5 py-2 text-xs leading-[17px]"><strong>{reason.label}</strong> {reason.text}</p>
            </section>
            <section className="flex flex-col gap-1.5">
              <H3>PROBABILIDADE NO DIA</H3>
              <PointProbabilityChart items={series} now={now} width={444} height={120} hours={24} fallbackThresholds={p?.riskThresholds} strokeWidth={2.5} />
            </section>
            <section className="flex flex-col gap-2">
              <H3>O QUE MAIS PESOU (SHAP, EM PONTOS PERCENTUAIS)</H3>
              {rows.length > 0 && !unknown ? rows.map((c) => (
                <div key={c.id} data-testid="analysis-contributor" className="flex flex-col gap-[3px]">
                  <div className="flex justify-between gap-2 text-[13px] leading-[18px]"><span>{c.label} {c.valueText && <span className="font-mono text-muted-foreground">{c.valueText}</span>}</span><span className="font-mono font-bold">{c.ppText}</span></div>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${c.width.toFixed(1)}%` }} /></div>
                </div>
              )) : <p className="m-0 text-xs leading-[17px] text-muted-foreground">{unknown ? 'Sem previsão agora, então não há contribuições. Use sensores e observação em campo.' : 'Nenhum fator relevante agora.'}</p>}
              {imputed.map((im) => <p key={im.featureId} role="note" data-testid="imputed" className="m-0 rounded-lg border border-dashed border-warning px-2 py-1.5 text-xs leading-4">{im.label}: imputado (faltou hora na janela).</p>)}
            </section>
          </>
        )}

        {tab === 'inputs' && (
          <>
            <section className="flex flex-col gap-2">
              <H3>ENTRADAS DO MODELO AGORA</H3>
              <div className="grid grid-cols-2 gap-2">
                {inputTiles(point, imputedIds).map((t) => (
                  <div key={t.id} data-testid="input-tile" data-imputed={t.imputed} className={cn('rounded-[10px] bg-muted p-2.5', t.imputed ? 'border border-dashed border-warning' : 'border border-transparent')}>
                    <div className="text-[11px] leading-[14px] text-muted-foreground">{t.label}</div>
                    <div className={cn('font-mono text-base font-extrabold leading-[22px]', t.missing && !t.imputed && 'text-warning')}>{t.value}</div>
                    <div className="text-[11px] leading-[14px] text-muted-foreground">{t.sub}</div>
                  </div>
                ))}
              </div>
            </section>
            <section className="flex flex-col gap-1.5">
              <H3>CHUVA DO PONTO · ESTAÇÕES ATÉ 5 KM</H3>
              <p className="m-0 text-xs leading-4 text-muted-foreground">Vale o maior valor entre as estações válidas. Clique para abrir o card da estação.</p>
              {rain?.hourEndUtc && <p className="m-0 text-[11px] text-muted-foreground">dados até {formatHoraCurta(rain.hourEndUtc)}</p>}
              {rain?.candidates.map((c) => (
                <button key={c.stationId} type="button" data-role={c.role} onClick={() => onOpenStation?.(c.stationId)}
                  className={cn('grid cursor-pointer grid-cols-[12px_1fr_auto_auto] items-center gap-2 rounded-lg border bg-transparent px-2 py-[7px] text-left text-xs leading-4 text-foreground', c.role === 'USED' ? 'border-primary bg-primary/10' : 'border-border')}>
                  <span aria-hidden="true" className={cn('size-2.5 rounded-full', c.role === 'USED' ? 'bg-primary' : c.role === 'EXCLUDED' ? 'bg-destructive' : 'bg-chart-3')} />
                  <span><strong>{c.name}</strong> <span className="text-muted-foreground">· {distanceText(c.distanceM)} · {candidateStatus(c)}</span></span>
                  <span className="font-mono">{candidateValue(c)}</span>
                  <span className={cn('text-[11px] font-bold', c.role === 'USED' ? 'text-primary' : c.role === 'EXCLUDED' ? 'text-destructive' : 'text-muted-foreground')}>{ROLE_TAG[c.role]}</span>
                </button>
              ))}
              {rain && rain.candidates.length === 0 && <p className="m-0 text-xs text-muted-foreground">Nenhuma estação do Cemaden dentro do raio.</p>}
            </section>
          </>
        )}

        {tab === 'prov' && (
          <>
            <section className="flex flex-col gap-2">
              <H3>DE ONDE VEIO ESTA PREVISÃO</H3>
              <dl data-testid="provenance" className="m-0 grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 text-xs leading-4">
                {([
                  ['modelVersion', p?.modelVersion ?? '—'],
                  ['riskThresholds', p?.riskThresholds ? `moderado ≥ ${pctTxt(p.riskThresholds.medium)} · alto ≥ ${pctTxt(p.riskThresholds.high)}${p.riskThresholds.source ? ` (${p.riskThresholds.source})` : ''}` : 'indisponível'],
                  ['rainSource', p?.rainSource === 'MEASURED' ? 'chuva medida (pluviômetro do Cemaden)' : p?.rainSource ?? '—'],
                  ['trainingData', p?.trainingData ?? '—'],
                  ['issuedAt', formatHoraCurta(p?.issuedAt) ?? '—'],
                  ['validUntil', formatHoraCurta(p?.validUntil) ?? '—'],
                  ['degradationReason', p?.degradationReason ?? 'nenhum'],
                  ['contributors', `${p?.contributors?.length ?? 0} fator(es) · ${imputed.length} imputado(s)`],
                ] as const).map(([k, v]) => <React.Fragment key={k}><dt className="font-mono text-primary">{k}</dt><dd className="m-0">{v}</dd></React.Fragment>)}
              </dl>
            </section>
            <section className="flex flex-col gap-1.5">
              <H3>LIMITES DESTA ESTIMATIVA</H3>
              <ul className="m-0 pl-[18px] text-xs leading-[17px] text-muted-foreground">
                {p?.trainingData === 'SYNTHETIC' && <li>Treino com rótulo sintético: a probabilidade não foi validada contra alagamento real.</li>}
                <li>Probabilidade bruta: compare com os limiares, não leia como frequência.</li>
                <li>O nível do rio não entra no modelo; aparece só para a operação.</li>
                <li>A classe não confirma alagamento no local.</li>
                {p?.rainSource === 'MEASURED' && num(rain?.valueMm) !== '—' && <li>A chuva vem do maior valor entre as estações válidas a até 5 km (ADR 0022).</li>}
              </ul>
            </section>
          </>
        )}
      </div>
      <footer className="flex gap-2 border-t border-border px-[18px] py-3">
        <Link to={`/pontos/${point.slug}`} className="flex h-[42px] flex-1 items-center justify-center rounded-[10px] bg-primary text-[13px] font-bold text-primary-foreground no-underline hover:text-primary-foreground hover:opacity-90">Abrir página do ponto</Link>
        <Link to="/relatos" className="flex h-[42px] items-center rounded-[10px] border border-border px-3.5 text-[13px] font-bold text-foreground no-underline">Relatos</Link>
        <Link to="/relatorio" className="flex h-[42px] items-center rounded-[10px] border border-border px-3.5 text-[13px] font-bold text-foreground no-underline">Relatório</Link>
      </footer>
    </aside>
  );
};
