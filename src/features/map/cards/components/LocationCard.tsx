import { InfoTip } from '@/components/InfoTip';
import React, { useEffect, useState } from 'react';
import { Check, CloudRain, Copy, Info, MapPin, Mountain, ShieldCheck, Thermometer, TriangleAlert, Waves, X } from 'lucide-react';
import { SourceTag } from '@/components/risk/SourceTag';
import { formatHoraCurta, num } from '@/features/operacao/utils/format';
import { candidateStatus, candidateValue, distanceText, ROLE_TAG } from '@/features/points/utils/rainCandidates';
import { cn } from '@/lib/utils';
import type { LocationAnalysis } from '../schemas/locationAnalysis.schema';
import { CANDIDATE_TAG_CLASS, bannerOf, locationState, rainNote, rainSourceTag, rainTiles } from '../utils/locationView';
import { TONE_BORDER, TONE_TEXT, TONE_TINT } from '../utils/stationCardView';

interface Props {
  analysis: LocationAnalysis;
  onClose?: () => void;
  onOpenPoint?: (slug: string) => void;
  onOpenStation?: (stationId: string) => void;
  onReport?: () => void;
}

const CEMADEN = 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC';

const H3: React.FC<{ icon: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }> = ({ icon, children, aside }) => (
  <div className="flex items-center justify-between gap-2"><h3 className="m-0 flex items-center gap-2 text-[13px] font-extrabold leading-[18px]"><span aria-hidden="true" className="text-primary [&>svg]:size-4">{icon}</span>{children}</h3>{aside}</div>
);

const Tile: React.FC<{ label: string; children: React.ReactNode; sub?: React.ReactNode; className?: string; testId?: string }> = ({ label, children, sub, className, testId }) => (
  <div data-testid={testId} className={cn('rounded-xl bg-muted p-2.5', className)}>
    <div className="text-xs font-bold leading-4 text-primary">{label}</div>
    <div className="font-mono text-lg font-extrabold leading-6">{children}</div>
    {sub && <div className="text-[11px] leading-[14px] text-muted-foreground">{sub}</div>}
  </div>
);

const Unit: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="ml-0.5 font-sans text-[11px] font-normal text-muted-foreground">{children}</span>;

/** Card da análise de local (B7), como no protótipo (CardLocal): do lado oposto ao clique; medido e estimado nunca se misturam. */
export const LocationCard: React.FC<Props> = ({ analysis: a, onClose, onOpenPoint, onOpenStation, onReport }) => {
  const state = locationState(a);
  const banner = bannerOf(state);
  const tag = rainSourceTag(a.rain.mode);
  const estimated = a.rain.mode === 'ESTIMATED';
  const np = a.nearestPoint;
  const coord = `${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}`.replace(/\./g, ',');
  const showRain = state !== 'SEA';
  const showLand = state !== 'SEA' && state !== 'OUTSIDE';
  const canReport = showLand && Boolean(onReport);
  const citesCemaden = !estimated || a.rain.candidates.length > 0;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = () => {
    void navigator.clipboard?.writeText(`${a.lat.toFixed(5)}, ${a.lon.toFixed(5)}`).then(() => setCopied(true), () => undefined);
  };
  return (
    <aside role="dialog" aria-label={`Análise do local ${coord}`} data-state={state}
      className="flex max-h-full w-[400px] max-w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-elevation-overlay">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/15 text-primary"><MapPin className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-base font-extrabold leading-[22px]">Análise de local</p>
          <p className="m-0 font-mono text-xs leading-4 text-muted-foreground">{coord}{a.at ? ` · dados das ${formatHoraCurta(a.at)}` : ''}</p>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Fechar análise de local" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-[18px]" aria-hidden="true" /></button>}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain scroll px-4 py-3.5">
        {banner && (
          <div role="status" data-testid="location-banner" className={cn('flex gap-2 rounded-[10px] border-[1.5px] px-3 py-2.5 text-xs leading-[17px]', TONE_BORDER[banner.tone], TONE_TINT[banner.tone], banner.dashed && 'border-dashed')}>
            <Info className={cn('mt-px size-4 shrink-0', TONE_TEXT[banner.tone])} aria-hidden="true" />
            <span><strong>{banner.title}</strong> {banner.text}</span>
          </div>
        )}

        <section aria-label="Ponto crítico mais próximo" className="flex flex-col gap-2">
          <H3 icon={<ShieldCheck />}>Ponto crítico mais próximo<InfoTip text="O alerta de alagamento só existe nos 5 pontos críticos. Este local não tem alerta próprio: abra o ponto mais próximo para ver o nível." /></H3>
          {np ? (
            <button type="button" data-testid="nearest-point" onClick={() => onOpenPoint?.(np.slug)} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-transparent px-3 py-2.5 text-left text-foreground hover:bg-muted">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold leading-[18px]">{np.name}</span>
                <span className="block text-xs leading-4 text-muted-foreground">ponto crítico mais próximo{np.distanceKm != null ? ` · ${num(np.distanceKm, 1)} km` : ''}</span>
              </span>
            </button>
          ) : <p className="m-0 text-xs text-muted-foreground">Nenhum ponto crítico por perto.</p>}
        </section>

        {showRain && (
          <section aria-label="Chuva" data-mode={a.rain.mode} className="flex flex-col gap-2">
            <H3 icon={<CloudRain />} aside={
              <SourceTag kind={tag.kind} label={tag.label} data-testid="rain-source-tag" className="h-5 rounded-md px-[7px] font-mono" />
            }>Chuva</H3>
            <div className="grid grid-cols-3 gap-2">
              {rainTiles(a).map((t) => (
                <div key={t.label} data-testid="rain-tile" className={cn('rounded-xl border p-2.5',
                  t.missing || estimated ? 'border-dashed border-warning' : t.first ? 'border-primary bg-primary/10' : 'border-border')}>
                  <div className={cn('text-xs font-bold leading-4', estimated ? 'text-warning' : 'text-primary')}>{t.label}</div>
                  <div className={cn('font-mono text-lg font-extrabold leading-6', t.missing && 'text-warning')}>{t.value}{t.unit && <Unit>{t.unit}</Unit>}</div>
                </div>
              ))}
            </div>
            <p className="m-0 text-xs leading-[17px] text-muted-foreground">{rainNote(a.rain.mode)}</p>
            {a.rain.candidates.length > 0 && (
              <div className="flex flex-col gap-1">
                <span data-testid="candidates-title" className="text-[11px] font-extrabold tracking-[.06em] text-muted-foreground">
                  {estimated ? 'PLUVIÔMETROS NO RAIO (NENHUM VÁLIDO)' : `PLUVIÔMETROS ATÉ 5 KM · ${a.rain.candidates.length}${a.rain.nValid != null ? ` (${a.rain.nValid} VÁLIDOS)` : ''}`}
                </span>
                {a.rain.candidates.map((c) => (
                  <button key={c.stationId} type="button" data-role={c.role} onClick={() => onOpenStation?.(c.stationId)}
                    title={`${c.name} · ${distanceText(c.distanceM)} · ${candidateStatus(c)}`}
                    className={cn('grid cursor-pointer grid-cols-[10px_1fr_auto_auto] items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs leading-4 text-foreground hover:bg-muted',
                      c.role === 'USED' ? 'border-primary bg-primary/10' : 'border-border bg-transparent')}>
                    <span aria-hidden="true" className={cn('size-2 rounded-full', c.role === 'USED' ? 'bg-primary' : c.role === 'EXCLUDED' ? 'bg-destructive' : 'bg-chart-3')} />
                    <span className="min-w-0 truncate"><strong>{c.name}</strong> <span className="text-muted-foreground">· {distanceText(c.distanceM)}</span></span>
                    {/* Fora: o motivo do mês no lugar do valor; estimativa: nenhum valor medido ao lado do estimado. */}
                    {c.role === 'EXCLUDED' ? <span className="max-w-[150px] truncate text-[11px] text-destructive">{candidateStatus(c)}</span>
                      : estimated ? <span aria-hidden="true" />
                      : <span className="font-mono">{candidateValue({ role: c.role, valueMm: c.valueMmH ?? null })}</span>}
                    <span className={cn('min-w-[58px] text-right text-[11px] font-bold', CANDIDATE_TAG_CLASS[c.role])}>{ROLE_TAG[c.role]}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <section aria-label="Água lá fora" className="flex flex-col gap-2">
          <H3 icon={<Waves />}>Água lá fora</H3>
          <div className="grid grid-cols-2 gap-2">
            <Tile testId="tide-tile" label="Maré prevista"
              sub={`${a.tide?.harbor ?? 'Porto do Recife'}${a.tide?.rising == null ? '' : a.tide.rising ? ' · enchendo' : ' · vazando'}`}>
              {a.tide?.levelM != null ? <>{num(a.tide.levelM, 2)}<Unit>m</Unit></> : '—'}
              {a.tide?.tideSource === 'HARMONIC' && <div className="mt-1"><SourceTag kind="TIDE_HARMONIC" data-testid="tide-source-tag" /></div>}
            </Tile>
            <Tile testId="river-tile" label="Rio mais próximo" className={cn(!a.river && 'opacity-60')}
              sub={a.river ? `${a.river.name}${a.river.distanceKm != null ? ` · ${num(a.river.distanceKm, 1)} km` : ''} · fora do modelo` : 'nenhuma régua a menos de 6 km'}>
              {a.river?.levelM != null ? <>{num(a.river.levelM, 2)}<Unit>m</Unit></> : '—'}
            </Tile>
          </div>
          <p className="m-0 text-xs leading-[17px] text-muted-foreground">Maré sobre o nível de redução da Marinha: não comparar com a altitude do terreno.</p>
        </section>

        {showLand && (
          <section aria-label="Terreno" className="flex flex-col gap-2">
            <H3 icon={<Mountain />}>Terreno</H3>
            <div className="grid grid-cols-2 gap-2" data-testid="terrain">
              <Tile label="Altitude" sub={a.terrain ? 'PE3D (MDT 1 m) · cota relativa' : 'fora da cobertura do PE3D'}>
                {a.terrain?.elevationM != null ? <>{num(a.terrain.elevationM, 1)}<Unit>m</Unit></> : '—'}
              </Tile>
              <Tile label="Até a costa" sub={a.terrain?.distanceToCoastKm != null ? 'distância em linha reta' : 'sem linha de costa no MAPi'}>
                {a.terrain?.distanceToCoastKm != null ? <>{num(a.terrain.distanceToCoastKm, 1)}<Unit>km</Unit></> : '—'}
              </Tile>
            </div>
          </section>
        )}

        {a.weather && (
          <section aria-label="Tempo agora" data-testid="weather" className="flex flex-col gap-2">
            <H3 icon={<Thermometer />} aside={<span className="inline-flex h-5 items-center whitespace-nowrap rounded-md border border-warning px-[7px] font-mono text-[10px] font-bold text-warning">estimado · Open-Meteo</span>}>Tempo agora</H3>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['Temp.', a.weather.temperatureC != null ? `${num(a.weather.temperatureC, 1)} °C` : '—'],
                ['Umidade', a.weather.humidityPct != null ? `${Math.round(a.weather.humidityPct)}%` : '—'],
                ['Vento', a.weather.windKmh != null ? `${Math.round(a.weather.windKmh)} km/h` : '—'],
              ] as const).map(([l, v]) => (
                <div key={l} className="rounded-xl bg-muted p-2.5"><div className="text-xs font-bold leading-4 text-muted-foreground">{l}</div><div className="font-mono text-[15px] font-extrabold leading-[22px]">{v}</div></div>
              ))}
            </div>
          </section>
        )}

        <p className="m-0 text-[9px] leading-3 text-muted-foreground">
          {citesCemaden ? `${a.attribution ?? CEMADEN} · maré DHN/TabuaMare · terreno PE3D · tempo Open-Meteo` : 'Chuva e tempo Open-Meteo (reanálise) · maré DHN/TabuaMare · terreno PE3D'}
        </p>
      </div>

      <footer className="flex gap-2 border-t border-border px-4 py-3">
        <button type="button" onClick={canReport ? onReport : undefined} disabled={!canReport}
          className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-destructive bg-destructive/10 text-sm font-bold text-destructive hover:bg-destructive/15 disabled:cursor-not-allowed disabled:opacity-45">
          <TriangleAlert className="size-4" aria-hidden="true" />Reportar alagamento aqui
        </button>
        <button type="button" onClick={copy} aria-label="Copiar coordenadas" title={copied ? 'Copiado' : 'Copiar coordenadas'}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-transparent text-foreground hover:bg-muted">
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        </button>
      </footer>
    </aside>
  );
};
