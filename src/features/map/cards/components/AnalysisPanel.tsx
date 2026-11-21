import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { InfoTip } from '@/components/InfoTip';
import { OnlyInDetail } from '@/lib/detailMode';
import { formatHoraCurta } from '@/features/operacao/utils/format';
import { candidateStatus, candidateValue, distanceText, ROLE_TAG } from '@/features/points/utils/rainCandidates';
import type { RainCandidates } from '@/features/points/schemas/rain-candidates.schema';
import { cn } from '@/lib/utils';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { FloodChip } from '@/features/alagamento/components/AlertaRegressao';
import { ExperimentalTag } from '@/features/alagamento/components/RegressaoCard';
import { BaldeChart } from '@/features/alagamento/components/BaldeChart';
import { VisitorChip } from '@/features/alagamento/components/PointRegressaoBlock';
import { BAR_CLASS, EDGE_CLASS, HCRIT_CM, fmt1, floodChipOf, pctOfBar, rangeCm } from '@/features/alagamento/utils/alagamentoText';
import type { FloodLevel } from '@/features/alagamento/schemas/alagamento.schema';
import { titleCasePlace } from '../../utils/overview';
import type { FloodPointResponseDTO } from '../../types';
import { ANALYSIS_INFO, ANALYSIS_TABS, TAB_LABEL, type AnalysisTab } from '../utils/analysis';

interface Props {
  point: FloodPointResponseDTO;
  rain?: RainCandidates;
  /** Alerta por regressão do ponto (só ADMIN em modo sombra). */
  alagamento?: AlagamentoPonto | null;
  alagamentoLoading?: boolean;
  alagamentoError?: boolean;
  isAdmin?: boolean;
  tab: AnalysisTab;
  onTab: (t: AnalysisTab) => void;
  onClose?: () => void;
  /** Estação da lista até 5 km: abre o card da estação ao lado. */
  onOpenStation?: (stationId: string) => void;
}

/** Título curto com ⓘ (5.11 item 9). */
const H3: React.FC<{ title: string; info: string }> = ({ title, info }) => (
  <h3 className="m-0 flex items-center gap-1.5 text-[11px] font-extrabold uppercase leading-[14px] tracking-[.06em] text-muted-foreground">
    {title}<InfoTip text={info} />
  </h3>
);


const LEVEL_LABEL: Record<FloodLevel, string> = { ALERTA: 'Alerta', ATENCAO: 'Atenção', SEM_ALERTA: 'Sem alerta', SEM_DADO: 'Sem dado' };
const BOX_CLASS: Record<FloodLevel, string> = {
  ALERTA: 'border-destructive', ATENCAO: 'border-warning', SEM_ALERTA: 'border-border', SEM_DADO: 'border-dashed border-muted-foreground',
};
const LABEL_CLASS: Record<FloodLevel, string> = {
  ALERTA: 'text-destructive', ATENCAO: 'text-warning', SEM_ALERTA: 'text-success', SEM_DADO: 'text-muted-foreground',
};

/** Prancha "PainelAnalise": uma caixa por prazo, com o prazo e o nível à esquerda, a barra e "17–33 cm · até 16h30" à direita. */
const HorizonBoxes: React.FC<{ horizons: AlagamentoPonto['horizons'] }> = ({ horizons }) => (
  <ul className="m-0 flex list-none flex-col gap-2 p-0">
    {horizons.map((h) => {
      const c = BAR_CLASS[h.level];
      return (
        <li key={h.hours} data-testid={`horizonte-${h.hours}`} data-level={h.level}
          className={cn('grid grid-cols-[64px_1fr] items-center gap-2.5 rounded-[10px] border px-2.5 py-2', BOX_CLASS[h.level])}>
          <div>
            <div className="font-mono text-[15px] leading-5 font-extrabold">{h.hours} h</div>
            <div className={cn('whitespace-nowrap text-[11px] font-bold', LABEL_CLASS[h.level])}>{LEVEL_LABEL[h.level]}</div>
          </div>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="relative my-[5px] h-2 rounded-full bg-muted" role="img"
              aria-label={`${h.hours} h: lâmina provável ${fmt1(h.sheetQ50Cm) ?? 'sem dado'} cm, pessimista ${fmt1(h.sheetQ95Cm) ?? 'sem dado'} cm; alagamento a partir de ${HCRIT_CM} cm`}>
              <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q95)} style={{ width: `${pctOfBar(h.sheetQ95Cm)}%` }} />
              <span className={cn('absolute inset-y-0 left-0 rounded-full', c.q50)} style={{ width: `${pctOfBar(h.sheetQ50Cm)}%` }} />
              <span aria-hidden="true" className="absolute -inset-y-[5px] w-0.5 bg-risk-high-edge" style={{ left: `${pctOfBar(HCRIT_CM)}%` }} />
            </span>
            <span className="font-mono text-[11px] leading-[15px] text-muted-foreground">
              {rangeCm(h.sheetQ50Cm, h.sheetQ95Cm)}{h.validUntil ? ` · até ${formatHoraCurta(h.validUntil)}` : ''}
            </span>
          </div>
        </li>
      );
    })}
  </ul>
);

/** "chuva no ponto (até 5 km) nos últimos 10 min: 0,0 mm (−0,2 mm na previsão)" → rótulo à esquerda, valor à direita. */
const splitShap = (text: string): { label: string; value: string } => {
  const i = text.lastIndexOf(': ');
  if (i < 0) return { label: text, value: '' };
  const label = text.slice(0, i);
  return { label: label.charAt(0).toUpperCase() + label.slice(1), value: text.slice(i + 2) };
};

const LIMITS = [
  'Nenhum modelo é treinado com rótulo de alagamento: a chuva prevista vem do rain_v1 (alvo medido) e o resto é física.',
  'O balde quase não dispara com os parâmetros atuais: 1 evento de 15 cm em 5 anos (TR 2) e, na validação, nenhum alerta.',
  'O aviso de 1 h só chega com a chuva já caindo: nenhum aviso antes do início da chuva no teste do rain_v1.',
  'Experimental até a validação externa (item 2.3) ser aprovada pelo orientador.',
];

/** Painel lateral de 480 px com a análise completa do ponto pelo alerta por regressão (5.4): Por quê · Balde · Origem. */
export const AnalysisPanel: React.FC<Props> = ({ point, rain, alagamento: a, alagamentoLoading = false, alagamentoError = false, isAdmin = false, tab, onTab, onClose, onOpenStation }) => {
  const semDado = !a || a.level === 'SEM_DADO';
  const chip = a ? floodChipOf(a) : null;
  const e = a?.explanation;
  const emptyText = !isAdmin ? 'O alerta de alagamento por regressão é experimental: só o administrador vê enquanto a validação não for aprovada.'
    : alagamentoLoading ? 'Lendo o alerta de alagamento…'
      : alagamentoError ? 'Não foi possível ler o alerta de alagamento agora.'
        : !a ? 'Alerta de alagamento ainda não calculado para este ponto.'
          : `Sem dado: ${a.reasonText ?? 'motivo não informado'}. Sem dado não é sem alerta.`;
  const empty = <p data-testid="analysis-empty" className="m-0 rounded-lg border border-dashed border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">{emptyText}</p>;
  const stations = (
    <section className="flex flex-col gap-1.5">
      <H3 title="Estações até 5 km" info={ANALYSIS_INFO.stations} />
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
  );
  return (
    <section role="dialog" aria-label={`Análise completa de ${point.name}`} data-testid="analysis-panel" data-level={a?.level ?? (isAdmin ? 'SEM_DADO' : 'VISITOR')}
      className={cn('flex h-full w-[30rem] max-w-full flex-col border-l border-t-4 border-border bg-card text-foreground shadow-elevation-overlay', chip ? EDGE_CLASS[chip.tone] : 'border-t-muted-foreground [border-top-style:dashed]')}>
      <header className="flex flex-col gap-2 border-b border-border px-[18px] pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold tracking-[.06em] text-muted-foreground">ANÁLISE COMPLETA{a?.evaluatedAt ? <> · <span className="font-mono">{formatHoraCurta(a.evaluatedAt)}</span></> : null}</span>
          {onClose && <button type="button" onClick={onClose} aria-label="Fechar análise" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-4" aria-hidden="true" /></button>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {a ? <FloodChip ponto={a} /> : isAdmin ? null : <VisitorChip />}
          <ExperimentalTag />
        </div>
        <div>
          <p className="m-0 text-xl font-extrabold leading-[26px]">{point.name}</p>
          <p className="m-0 text-xs leading-4 text-muted-foreground">{titleCasePlace(point.municipality ?? 'Recife')}{a?.issuedAt ? ` · ${formatHoraCurta(a.issuedAt)}` : ''}</p>
        </div>
        <div role="tablist" aria-label="Seções da análise" className="flex gap-0.5 rounded-[10px] bg-muted p-[3px]">
          {ANALYSIS_TABS.map((t) => (
            <button key={t} id={`analysis-tab-${t}`} type="button" role="tab" aria-selected={tab === t} aria-controls="analysis-body" onClick={() => onTab(t)}
              className={cn('h-[30px] flex-1 cursor-pointer rounded-lg border-0 text-xs font-bold text-foreground', tab === t ? 'bg-card' : 'bg-transparent')}>{TAB_LABEL[t]}</button>
          ))}
        </div>
      </header>

      <div id="analysis-body" role="tabpanel" aria-labelledby={`analysis-tab-${tab}`} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain scroll px-[18px] py-3.5">
        {tab === 'why' && (semDado || !a ? empty : (
          <>
            <section className="flex flex-col gap-2">
              <H3 title="Nível por prazo" info={ANALYSIS_INFO.level} />
              <HorizonBoxes horizons={a.horizons} />
            </section>
            <section className="flex flex-col gap-2">
              <H3 title="O que mais pesou" info={ANALYSIS_INFO.shap} />
              {e && e.shapTop3.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] leading-[18px]">
                  {e.shapTop3.map((s) => {
                    const { label, value } = splitShap(s.text);
                    return (
                      <li key={s.text} data-testid="analysis-shap" className="flex justify-between gap-2">
                        <span>{label}</span>
                        <span className="shrink-0 text-right">
                          <span className="block font-mono font-bold">{value.split(' (')[0]}</span>
                          {value.includes(' (') && <span className="block font-mono text-[11px] leading-[14px] text-muted-foreground">{value.slice(value.indexOf(' (') + 2).replace(/\)$/, '')}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="m-0 text-xs text-muted-foreground">sem explicação neste ciclo</p>}
            </section>
            <section className="flex flex-col gap-1.5">
              <H3 title="Para chegar a 15 cm" info={ANALYSIS_INFO.cf} />
              <p data-testid="analysis-cf" className="m-0 rounded-lg bg-muted px-2.5 py-2 text-[13px] leading-[18px]">{e?.counterfactualText ?? 'sem cálculo neste ciclo'}</p>
            </section>
          </>
        ))}

        {tab === 'balde' && (semDado || !a ? empty : (
          <>
            <section className="flex flex-col gap-2">
              <H3 title="Balde a cada 10 min" info={ANALYSIS_INFO.balde} />
              <BaldeChart steps={e?.decomposition ?? []} capacityM3H={e?.capacityM3H} />
            </section>
            <section className="flex flex-col gap-1.5">
              <H3 title="Sensibilidade" info={ANALYSIS_INFO.sens} />
              <p data-testid="analysis-sens" className="m-0 text-[13px] leading-[18px]">{e?.sensitivity?.text ?? 'sem cálculo neste ciclo'}</p>
            </section>
          </>
        ))}

        {tab === 'prov' && (
          <>
            {a && isAdmin ? (
              <section className="flex flex-col gap-2">
                <H3 title="Origem" info={ANALYSIS_INFO.prov} />
                <dl data-testid="provenance" className="m-0 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-xs leading-4">
                  {([
                    ['Rota', 'POST /v1/flood/forecast (IA) · GET /api/alagamento/pontos'],
                    ['Modelos', Object.entries(a.modelVersions).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'],
                    ['Commit', a.codeVersion ? a.codeVersion.slice(0, 12) : '—'],
                    ['Emissão', formatHoraCurta(a.issuedAt) ?? '—'],
                    ['Validade', a.horizons.length ? a.horizons.map((h) => `${h.hours} h até ${formatHoraCurta(h.validUntil) ?? '—'}`).join(' · ') : '—'],
                    ['Estado inicial', a.hNowCm != null ? `lâmina ${a.hNowCm.toLocaleString('pt-BR')} cm agora (24 h de chuva medida)` : 'sem dado'],
                    ['Fontes', a.sources.length ? a.sources.join(' · ') : '—'],
                    ['Ausências', a.level === 'SEM_DADO' ? a.reasonText ?? '—' : a.missingInputs.length ? a.missingInputs.join(', ') : 'nenhuma'],
                    ['Status', 'experimental · não validado'],
                  ] as const).map(([k, v]) => <React.Fragment key={k}><dt className="font-mono text-primary">{k}</dt><dd className="m-0 break-words">{v}</dd></React.Fragment>)}
                </dl>
                <p className="m-0 text-[11px] text-muted-foreground">{a.attribution}</p>
              </section>
            ) : empty}
            {stations}
            <OnlyInDetail>
              <section data-testid="analysis-limits" className="flex flex-col gap-1.5">
                <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[.06em] text-muted-foreground">Limites</h3>
                <ul className="m-0 pl-[18px] text-xs leading-[17px] text-muted-foreground">{LIMITS.map((l) => <li key={l}>{l}</li>)}</ul>
              </section>
            </OnlyInDetail>
          </>
        )}
      </div>
      <footer className="flex gap-2 border-t border-border px-[18px] py-3">
        <Link to={`/pontos/${point.slug}`} className="flex h-[42px] flex-1 items-center justify-center rounded-[10px] bg-primary text-[13px] font-bold text-primary-foreground no-underline hover:text-primary-foreground hover:opacity-90">Abrir página do ponto</Link>
        <Link to="/relatos" className="flex h-[42px] items-center rounded-[10px] border border-border px-3.5 text-[13px] font-bold text-foreground no-underline">Relatos</Link>
        <Link to="/modelo" className="flex h-[42px] items-center rounded-[10px] border border-border px-3.5 text-[13px] font-bold text-foreground no-underline">Validação</Link>
      </footer>
    </section>
  );
};
