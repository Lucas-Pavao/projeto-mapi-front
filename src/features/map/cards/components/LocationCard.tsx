import React from 'react';
import { CloudRain, Info, MapPin, Mountain, Waves, X } from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { pctTxt } from '@/components/risk/thresholds';
import { formatRecifeHourMs } from '../../utils/datetime';
import { num } from '@/features/operacao/utils/format';
import { candidateStatus, candidateValue, distanceText, ROLE_TAG } from '@/features/points/utils/rainCandidates';
import { getRiskVisual, degradationText } from '@/components/risk/risk';
import { cn } from '@/lib/utils';
import type { LocationAnalysis } from '../schemas/locationAnalysis.schema';
import { bannerOf, locationState, rainSourceTag, rainTiles } from '../utils/locationView';
import { TONE_BORDER, TONE_TEXT } from '../utils/stationCardView';

interface Props {
  analysis: LocationAnalysis;
  onClose?: () => void;
  onOpenPoint?: (slug: string) => void;
  onOpenStation?: (stationId: string) => void;
  onReport?: () => void;
}

const H3: React.FC<{ icon: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }> = ({ icon, children, aside }) => (
  <div className="flex items-center justify-between gap-2"><h3 className="m-0 flex items-center gap-2 text-[13px] font-extrabold leading-[18px]"><span aria-hidden="true" className="text-primary [&>svg]:size-4">{icon}</span>{children}</h3>{aside}</div>
);

/** Card da análise de local (B7), do lado oposto ao clique. 5 estados; medido e estimado nunca se misturam. */
export const LocationCard: React.FC<Props> = ({ analysis: a, onClose, onOpenPoint, onOpenStation, onReport }) => {
  const state = locationState(a);
  const banner = bannerOf(state, a);
  const tag = rainSourceTag(a.rain.mode);
  const np = a.nearestPoint;
  const nearLevel = np?.riskLevel ?? 'UNKNOWN';
  const coord = `${a.lat.toFixed(4)}, ${a.lon.toFixed(4)}`.replace(/\./g, ',');
  const showRain = state !== 'SEA';
  const showTerrain = state !== 'SEA' && state !== 'OUTSIDE';
  return (
    <aside role="dialog" aria-label={`Análise do local ${coord}`} data-state={state}
      className="flex max-h-full w-[400px] max-w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-elevation-overlay">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/15 text-primary"><MapPin className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-base font-extrabold leading-[22px]">Análise de local</p>
          <p className="m-0 font-mono text-xs leading-4 text-muted-foreground">{coord}{a.at ? ` · dados das ${formatRecifeHourMs(Date.parse(a.at))}` : ''}</p>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Fechar análise de local" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><X className="size-[18px]" aria-hidden="true" /></button>}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3.5">
        {banner && (
          <div role="status" data-testid="location-banner" className={cn('flex gap-2 rounded-[10px] border-[1.5px] px-3 py-2.5 text-xs leading-[17px]', TONE_BORDER[banner.tone], banner.dashed && 'border-dashed')}>
            <Info className={cn('mt-px size-4 shrink-0', TONE_TEXT[banner.tone])} aria-hidden="true" />
            <span><strong>{banner.title}</strong> {banner.text}</span>
          </div>
        )}

        <section aria-label="Risco perto daqui" className="flex flex-col gap-2">
          <H3 icon={<MapPin />}>Risco perto daqui</H3>
          <p className="m-0 text-xs leading-[17px] text-muted-foreground">O modelo só calcula risco nos pontos críticos. Este local não tem previsão própria.</p>
          {np ? (
            <button type="button" data-testid="nearest-point" onClick={() => onOpenPoint?.(np.slug)} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-transparent px-3 py-2.5 text-left text-foreground hover:bg-muted">
              <RiskBadge level={nearLevel} variant="marker" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold leading-[18px]">{np.name}</span>
                <span className="block text-xs leading-4 text-muted-foreground">ponto crítico mais próximo{np.distanceKm != null ? ` · ${num(np.distanceKm, 1)} km` : ''} · {getRiskVisual(nearLevel).label}{nearLevel === 'UNKNOWN' ? ` (${degradationText(np.degradationReason as never)})` : ''}</span>
              </span>
              <span className="font-mono text-[13px] font-bold">{nearLevel === 'UNKNOWN' ? '' : pctTxt(np.probability)}</span>
            </button>
          ) : <p className="m-0 text-xs text-muted-foreground">Nenhum ponto crítico por perto.</p>}
        </section>

        {showRain && (
          <section aria-label="Chuva" data-mode={a.rain.mode} className="flex flex-col gap-2">
            <H3 icon={<CloudRain />} aside={<span data-testid="rain-source-tag" className={cn('inline-flex h-5 items-center rounded-md border px-[7px] font-mono text-[10px] font-bold', TONE_BORDER[tag.tone], TONE_TEXT[tag.tone], a.rain.mode === 'ESTIMATED' && 'border-dashed')}>{tag.text}</span>}>Chuva</H3>
            <div className="grid grid-cols-3 gap-2">
              {rainTiles(a).map((t) => (
                <div key={t.label} data-testid="rain-tile" className={cn('rounded-xl border p-2.5', a.rain.mode === 'ESTIMATED' ? 'border-dashed border-primary' : 'border-border')}>
                  <div className="text-xs font-bold leading-4 text-muted-foreground">{t.label}</div>
                  <div className={cn('font-mono text-lg font-extrabold leading-6', t.missing && 'text-warning')}>{t.value}<span className="ml-0.5 font-sans text-[11px] font-normal text-muted-foreground">{t.unit}</span></div>
                </div>
              ))}
            </div>
            <p className="m-0 text-xs leading-[17px] text-muted-foreground">
              {a.rain.mode === 'MEASURED' && a.rain.station ? `Valor do pluviômetro válido de maior leitura até 5 km: ${a.rain.station.name}, a ${distanceText(a.rain.station.distanceM)}.`
                : a.rain.mode === 'GAP' ? 'Nenhuma estação válida tem valor nesta hora.' : 'Reanálise do Open-Meteo: costuma suavizar picos e subestimar a chuva forte.'}
            </p>
            {a.rain.candidates.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-extrabold tracking-[.06em] text-muted-foreground">PLUVIÔMETROS ATÉ 5 KM · {a.rain.candidates.length} ({a.rain.nValid ?? 0} VÁLIDOS)</span>
                {a.rain.candidates.map((c) => (
                  <button key={c.stationId} type="button" data-role={c.role} onClick={() => onOpenStation?.(c.stationId)}
                    className={cn('grid cursor-pointer grid-cols-[10px_1fr_auto_auto] items-center gap-2 rounded-lg border bg-transparent px-2 py-1.5 text-left text-xs leading-4 text-foreground', c.role === 'USED' ? 'border-primary bg-primary/10' : 'border-border')}>
                    <span aria-hidden="true" className={cn('size-2 rounded-full', c.role === 'USED' ? 'bg-primary' : c.role === 'EXCLUDED' ? 'bg-destructive' : 'bg-chart-3')} />
                    <span className="min-w-0 truncate"><strong>{c.name}</strong> <span className="text-muted-foreground">· {distanceText(c.distanceM)} · {candidateStatus(c)}</span></span>
                    <span className="font-mono">{candidateValue({ role: c.role, valueMm: c.valueMmH ?? null })}</span>
                    <span className="min-w-[58px] text-right text-[11px] font-bold text-muted-foreground">{ROLE_TAG[c.role]}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <section aria-label="Água lá fora" className="flex flex-col gap-2">
          <H3 icon={<Waves />}>Água por perto</H3>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted p-2.5" data-testid="tide-tile">
              <div className="text-xs font-bold text-primary">Maré prevista</div>
              <div className="font-mono text-lg font-extrabold leading-6">{a.tide?.levelM != null ? num(a.tide.levelM, 2) : '—'}<span className="ml-0.5 font-sans text-[11px] font-normal text-muted-foreground"> m</span></div>
              <div className="text-[11px] leading-[14px] text-muted-foreground">{a.tide?.rising == null ? '' : a.tide.rising ? 'enchendo · ' : 'vazando · '}{a.tide?.harbor ?? 'tábua da DHN'}{a.tide?.verticalReference ? ` · ${a.tide.verticalReference}` : ''}</div>
            </div>
            <div className={cn('rounded-xl bg-muted p-2.5', !a.river && 'opacity-60')} data-testid="river-tile">
              <div className="text-xs font-bold text-primary">Rio mais próximo</div>
              <div className="font-mono text-lg font-extrabold leading-6">{a.river?.levelM != null ? `${num(a.river.levelM, 2)} m` : '—'}</div>
              <div className="text-[11px] leading-[14px] text-muted-foreground">{a.river ? `${a.river.name}${a.river.distanceKm != null ? ` · ${num(a.river.distanceKm, 1)} km` : ''} · fora do modelo` : 'nenhuma régua a até 6 km'}</div>
            </div>
          </div>
          <p className="m-0 text-xs leading-[17px] text-muted-foreground">Maré sobre o nível de redução da Marinha: não comparar com a altitude do terreno.</p>
        </section>

        {showTerrain && (
          <section aria-label="Terreno" className="flex flex-col gap-2">
            <H3 icon={<Mountain />}>Terreno</H3>
            {a.terrain ? (
              <div className="grid grid-cols-2 gap-2" data-testid="terrain">
                <div className="rounded-xl bg-muted p-2.5"><div className="text-xs font-bold text-muted-foreground">Altitude</div><div className="font-mono text-lg font-extrabold">{a.terrain.elevationM != null ? `${num(a.terrain.elevationM, 1)} m` : '—'}</div></div>
                <div className="rounded-xl bg-muted p-2.5"><div className="text-xs font-bold text-muted-foreground">Até a costa</div><div className="font-mono text-lg font-extrabold">{a.terrain.distanceToCoastKm != null ? `${num(a.terrain.distanceToCoastKm, 1)} km` : '—'}</div></div>
              </div>
            ) : <p className="m-0 text-xs text-muted-foreground">Sem cobertura do MDT PE3D neste local.</p>}
          </section>
        )}

        {a.weather && (
          <section aria-label="Tempo" className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-4 text-muted-foreground" data-testid="weather">
            <span>{a.weather.temperatureC != null ? `${num(a.weather.temperatureC, 1)} °C` : '—'}</span>
            <span>umidade {a.weather.humidityPct != null ? `${Math.round(a.weather.humidityPct)}%` : '—'}</span>
            <span>vento {a.weather.windKmh != null ? `${Math.round(a.weather.windKmh)} km/h` : '—'}</span>
            {a.weather.source && <span>{a.weather.source === 'OPEN_METEO' ? 'Open-Meteo' : a.weather.source}</span>}
          </section>
        )}
      </div>

      <footer className="flex flex-col gap-2 border-t border-border px-4 py-3">
        {state !== 'OUTSIDE' && onReport && <button type="button" onClick={onReport} className="h-10 cursor-pointer rounded-[10px] border-0 bg-primary text-[13px] font-bold text-primary-foreground hover:opacity-90">Reportar alagamento aqui</button>}
        <p className="m-0 text-[9px] leading-3 text-muted-foreground">{a.attribution ?? 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC'}</p>
      </footer>
    </aside>
  );
};
