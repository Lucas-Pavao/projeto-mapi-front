import React, { useMemo, useState } from 'react';
import { MapPin, Moon, Sun } from 'lucide-react';
import { FloodCountTiles } from '@/features/alagamento/components/FloodCountTiles';
import { ExperimentalTag } from '@/features/alagamento/components/RegressaoCard';
import type { AlagamentoPonto } from '@/features/alagamento/schemas/alagamento.schema';
import { TEXT_CLASS, countByLevel, fmt1, listLineOf } from '@/features/alagamento/utils/alagamentoText';
import { FloodLevelBadge } from '@/features/alagamento/components/FloodLevelBadge';

const SHEET_CLASS = { ALERTA: 'text-risk-high-text', ATENCAO: 'text-risk-moderate-text', SEM_ALERTA: 'text-risk-low-text', SEM_DADO: 'text-risk-unknown-text' } as const;
import { MobileMenu } from '@/components/layout/MobileMenu';
import { useTheme } from '@/hooks/useTheme';
import { ACCENT_LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';
import logoDark from '@/assets/mapi-symbol-on-dark.svg';
import logoLight from '@/assets/mapi-symbol-on-light.svg';
import type { FloodPointResponseDTO } from '../types';
import { fmtNum, sortPoints } from '../utils/overview';
import { formatRecife } from '../utils/datetime';
import type { useMapOverview } from '../hooks/useMapOverview';
import { RiskLegendControl } from './RiskLegendControl';

type Overview = ReturnType<typeof useMapOverview>;

/** Alturas da folha de pontos (px), como no protótipo: recolhida e expandida. */
export const MOBILE_SHEET_COLLAPSED = 300;
export const MOBILE_SHEET_EXPANDED = 560;

interface Props {
  points: FloodPointResponseDTO[];
  /** Alerta por regressão de cada ponto (só ADMIN, modo sombra). */
  alagamentoBySlug?: ReadonlyMap<string, AlagamentoPonto>;
  alagamentoFailed?: boolean;
  overview: Overview;
  lastSuccessAt: string | null;
  onSelect: (p: FloodPointResponseDTO) => void;
  onReport: () => void;
  /** Esconde barra, lista e botão quando o detalhe de um ponto está aberto (ele traz a própria barra). */
  hidden: boolean;
}

const chip = 'flex h-8 items-center rounded-full border bg-popover font-mono text-xs leading-4 font-bold';

/** Mapa no celular (MobileMapa.dc.html): barra de busca com o logotipo (abre o menu), chips, botão Reportar e folha de pontos. */
export const MobileMapa: React.FC<Props> = ({ points, alagamentoBySlug, alagamentoFailed = false, overview, lastSuccessAt, onSelect, onReport, hidden }) => {
  const { theme, accent, toggleTheme, cycleAccent } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const sheetH = expanded ? MOBILE_SHEET_EXPANDED : MOBILE_SHEET_COLLAPSED;
  const sorted = useMemo(() => sortPoints(points, alagamentoBySlug), [points, alagamentoBySlug]);
  const q = query.trim().toLowerCase();
  const rows = q ? sorted.filter((p) => `${p.name} ${p.municipality ?? ''} ${p.slug}`.toLowerCase().includes(q)) : sorted;
  const time = formatRecife(lastSuccessAt)?.slice(-5).replace(':', 'h');
  const counts = alagamentoBySlug && !alagamentoFailed ? countByLevel(points.map((p) => p.slug), alagamentoBySlug) : null;
  const themeLabel = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';

  return (
    <>
      {!hidden && <div className="absolute left-3 right-3 top-3 z-30 flex flex-col gap-2">
        <div className="flex h-[52px] items-center gap-2 rounded-[14px] border border-border bg-popover pl-1 pr-1.5 shadow-elevation-overlay">
          <button type="button" onClick={() => setMenu(true)} aria-label="Abrir menu" aria-expanded={menu} aria-controls="menu-principal" className="flex size-11 shrink-0 items-center justify-center rounded-[10px]">
            <img src={theme === 'light' ? logoLight : logoDark} alt="MAPi" className="size-[26px]" />
          </button>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ponto crítico"
            aria-label="Buscar ponto crítico"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-offset-0"
          />
          <button type="button" onClick={toggleTheme} aria-label={themeLabel} className="flex size-11 items-center justify-center rounded-[10px] text-foreground">
            {theme === 'dark' ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(chip, 'gap-1.5 border-border px-3')}>
            <span aria-hidden="true" className="live-dot size-2 rounded-full bg-success" />
            {time ?? '--h--'}
          </span>
          {overview.tideNow && (
            <span className={cn(chip, 'border-sand px-3')}>Maré {fmtNum(overview.tideNow.v, 2)} m</span>
          )}
          <button type="button" onClick={cycleAccent} aria-label={`${ACCENT_LABEL[accent]}: trocar cor de destaque`} className="-m-[6px] flex size-11 items-center justify-center">
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-popover">
              <span aria-hidden="true" className="size-3.5 rounded-full bg-primary" />
            </span>
          </button>
          {/* Níveis de risco recolhidos, como no desktop; o painel para acima do botão Reportar e da folha de pontos. */}
          <RiskLegendControl className="-my-2 ml-auto" bottomReserve={sheetH + 12 + 52 + 8} />
        </div>
      </div>}

      {!hidden && (
        <>
          <button
            type="button"
            onClick={onReport}
            style={{
              bottom: MOBILE_SHEET_COLLAPSED + 12,
              transform: `translateY(${expanded ? -(MOBILE_SHEET_EXPANDED - MOBILE_SHEET_COLLAPSED) : 0}px)`,
            }}
            className="mapi-press absolute right-3 z-30 flex h-[52px] items-center gap-2 rounded-full bg-primary px-[18px] text-[15px] font-extrabold text-primary-foreground shadow-[var(--elevation-overlay),var(--surface-highlight)] transition-transform duration-[var(--duration-sheet)] ease-[var(--ease-drawer)]"
          >
            <MapPin className="size-[18px]" aria-hidden="true" />
            Reportar alagamento
          </button>
          <section
            aria-label="Pontos de risco"
            style={{
              height: MOBILE_SHEET_EXPANDED,
              transform: `translateY(${expanded ? 0 : MOBILE_SHEET_EXPANDED - MOBILE_SHEET_COLLAPSED}px)`,
              paddingBottom: expanded ? 16 : MOBILE_SHEET_EXPANDED - MOBILE_SHEET_COLLAPSED + 16,
            }}
            className="mapi-enter-sheet absolute inset-x-0 bottom-0 z-30 box-border flex flex-col gap-3 rounded-t-[18px] border-t border-border bg-card px-4 pt-1.5 shadow-[var(--elevation-overlay),var(--surface-highlight)] transition-transform duration-[var(--duration-sheet)] ease-[var(--ease-drawer)]"
          >
            <button type="button" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? 'Recolher lista' : 'Expandir lista'} aria-expanded={expanded} className="mapi-press -my-2.5 flex h-11 w-20 shrink-0 items-center justify-center self-center">
              <span className="h-[5px] w-11 rounded-full bg-input" />
            </button>
            <div className="flex items-baseline justify-between">
              <h2 className="m-0 text-lg leading-6 font-extrabold">Agora na RMR</h2>
              <span className="text-xs text-muted-foreground">alerta em 1, 3 e 6 h</span>
            </div>
            {alagamentoBySlug && <FloodCountTiles counts={counts} size="sm" />}
            <ExperimentalTag className="self-start" />
            <ul className="scroll m-0 flex min-h-0 flex-1 list-none flex-col gap-1.5 p-0">
              {rows.length === 0 && <li className="py-4 text-center text-xs text-muted-foreground">{q ? 'Nenhum ponto com esse nome.' : 'Nenhum ponto crítico retornado pela API.'}</li>}
              {rows.map((p) => {
                const a = alagamentoBySlug?.get(p.slug);
                const line = alagamentoBySlug ? listLineOf(a) : null;
                return (
                  <li key={p.id}>
                    <button type="button" onClick={() => onSelect(p)} className="mapi-press-row flex min-h-14 w-full items-center gap-3 rounded-xl bg-muted p-2.5 text-left text-foreground hover:bg-secondary">
                      <FloodLevelBadge level={alagamentoBySlug ? (a?.level ?? 'SEM_DADO') : null} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] leading-5 font-extrabold">{p.name}</span>
                        {line ? (
                          <span data-testid="point-alert-line" className="block truncate text-xs text-muted-foreground"><span className={cn('font-bold', TEXT_CLASS[line.tone])}>{line.label}</span></span>
                        ) : (
                          <span className="block truncate text-xs text-muted-foreground">{p.municipality ?? 'Recife'}</span>
                        )}
                      </span>
                      {alagamentoBySlug && <span className={cn('flex-none font-mono text-sm font-bold', SHEET_CLASS[a?.level ?? 'SEM_DADO'])}>{a?.hNowCm == null ? '—' : `${fmt1(a.hNowCm)} cm`}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
      {menu && <MobileMenu top="top-0" onClose={() => setMenu(false)} />}
    </>
  );
};
