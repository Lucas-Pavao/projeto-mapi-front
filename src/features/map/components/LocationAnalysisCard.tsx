import React from 'react';
import {
  Activity, AlertTriangle, CloudRain, Droplets, Gauge, Mountain, Navigation, Sun, Thermometer, Waves, Wind, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PreciseDataResponse, SensorReadingDTO } from '../types';

interface LocationAnalysisCardProps {
  coords: { lat: number | null; lng: number | null } | null;
  loading: boolean;
  info: PreciseDataResponse | null;
  harborName?: string | null;
  onClose: () => void;
  onSensorSelect: (reading: SensorReadingDTO) => void;
  onReport: () => void;
}

const fmt = (v: number | null | undefined, digits = 1) =>
  v == null || Number.isNaN(v) ? '--' : v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "2026-10-12T08:45:00" (já em hora local do Recife, sem fuso) → "08:45". */
const hourOf = (ts: string | null | undefined) => (ts && ts.length >= 16 ? ts.slice(11, 16) : null);

/** "PORTO DO RECIFE (ESTADO DE PERNAMBUCO)" → "Porto do Recife". */
const harborLabel = (name: string | null | undefined) => {
  const base = name?.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
  if (!base) return 'tábua da DHN';
  return base.replace(/(^|\s)(\p{L})/gu, (_, sp: string, ch: string) => sp + ch.toUpperCase()).replace(/\b(Do|Da|De|Dos|Das)\b/g, (w) => w.toLowerCase());
};

const READING_LABEL: Record<string, string> = { PRECIPITATION: 'Chuva', RIVER_LEVEL: 'Rio' };

const Section: React.FC<{ title: string; icon: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, aside, children }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between px-0.5">
      <h4 className="m-0 flex items-center gap-1.5 text-2xs font-black uppercase tracking-[0.18em] text-zinc-400">
        <span aria-hidden="true" className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        {title}
      </h4>
      {aside}
    </div>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: string; unit?: string; icon: React.ReactNode }> = ({ label, value, unit, icon }) => (
  <div className="flex flex-col gap-0.5 rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-2">
    <span className="flex items-center gap-1 text-2xs font-bold uppercase tracking-tight text-zinc-400 [&>svg]:h-3 [&>svg]:w-3">
      {icon}
      {label}
    </span>
    <span className="text-sm font-black tabular-nums text-white">
      {value}
      {unit && value !== '--' && <small className="ml-0.5 text-2xs font-bold text-zinc-400">{unit}</small>}
    </span>
  </div>
);

/**
 * Card "Análise de local" (clique no mapa). Ordem pensada para quem decide sobre alagamento: primeiro o que molha
 * (chuva agora e acumulada), depois o que impede a água de sair (maré e rio), depois o lugar (altitude), e só então o
 * tempo e os sensores. Cabeçalho e ação fixos; só o miolo rola.
 */
export const LocationAnalysisCard: React.FC<LocationAnalysisCardProps> = ({
  coords, loading, info, harborName, onClose, onSensorSelect, onReport,
}) => {
  const p = info?.preciseData;
  const agg = p?.historicalAggregates;
  const readings = p?.latestReadings ?? [];
  const rainSensors = readings.filter((r) => r.type === 'PRECIPITATION');
  const riverReadings = readings.filter((r) => r.type === 'RIVER_LEVEL');
  const rainFromSensor = rainSensors.length > 0;
  const tide = p?.tideHeight ?? p?.tideHeightTabuaMare ?? null;
  const elev = info?.localElevation;
  const isMdt = elev?.source === 'PE3D_MDT_5M';
  const when = hourOf(p?.timestamp);

  return (
    <section
      aria-label="Análise de local"
      className="absolute bottom-2 inset-x-2 lg:inset-x-auto lg:bottom-10 lg:left-[26rem] lg:w-[25rem] z-30 flex max-h-[70vh] lg:max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Cabeçalho: o lugar (coordenada e altitude) */}
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/5 bg-white/[0.04] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/20">
            <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="m-0 text-sm font-black uppercase tracking-tight text-white">Análise de local</h3>
            <p className="m-0 text-2xs font-bold tabular-nums text-zinc-400">
              {coords?.lat != null && coords?.lng != null ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Localizando…'}
              {when && <> · dados das {when}</>}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Fechar análise de local">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="animate-pulse text-2xs font-black uppercase tracking-[0.2em] text-zinc-400">Consultando dados do local…</span>
          </div>
        ) : !p ? (
          <p className="py-8 text-center text-xs text-zinc-400">Não foi possível obter os dados deste local.</p>
        ) : (
          <>
            {/* 1. Chuva: o que molha */}
            <Section title="Chuva" icon={<CloudRain className="text-sky-400" />}
              aside={<span className="text-2xs text-zinc-500">{rainFromSensor ? `pluviômetro a ${fmt(Math.min(...rainSensors.map((r) => r.distanceKm ?? 99)), 1)} km` : 'Open-Meteo'}</span>}>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 flex flex-col justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5">
                  <span className="text-2xs font-bold uppercase text-sky-300">Agora</span>
                  <span className="text-xl font-black tabular-nums text-white">{fmt(p.precipitation)}<small className="ml-0.5 text-2xs text-zinc-400">mm</small></span>
                </div>
                <Stat label="3 h" value={fmt(agg?.rain3h)} unit="mm" icon={<Droplets className="text-sky-400" />} />
                <Stat label="24 h" value={fmt(agg?.rain24h)} unit="mm" icon={<Droplets className="text-sky-400" />} />
              </div>
              {agg?.rainSource && (
                <p className="m-0 px-0.5 text-2xs text-zinc-500">
                  Acumulados: {agg.rainSource === 'OPEN_METEO_FORECAST' ? 'Open-Meteo, últimas 24 h' : 'reanálise do Open-Meteo'}
                </p>
              )}
            </Section>

            {/* 2. Água lá fora: maré e rio (o que impede a galeria de escoar) */}
            <Section title="Água lá fora" icon={<Waves className="text-blue-400" />}>
              <div className={cn('grid gap-2', riverReadings.length > 0 ? 'grid-cols-2' : 'grid-cols-1')}>
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5">
                  <span className="text-2xs font-bold uppercase text-blue-300">Maré prevista agora</span>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xl font-black tabular-nums text-white">{fmt(tide, 2)}<small className="ml-0.5 text-2xs text-zinc-400">m</small></span>
                    <span className="truncate text-right text-2xs text-zinc-400" title={harborName ?? undefined}>{harborLabel(harborName)}</span>
                  </div>
                </div>
                {riverReadings.length > 0 && (
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5">
                    <span className="text-2xs font-bold uppercase text-cyan-300">Rio (régua mais próxima)</span>
                    <span className="block text-xl font-black tabular-nums text-white">{fmt(riverReadings[0].value, 2)}<small className="ml-0.5 text-2xs text-zinc-400">{riverReadings[0].unit || 'm'}</small></span>
                  </div>
                )}
              </div>
              <p className="m-0 px-0.5 text-2xs text-zinc-500">Altura da maré sobre o nível de redução da Marinha; não comparar com a altitude do terreno.</p>
            </Section>

            {/* 3. O lugar */}
            {elev?.meters != null && (
              <Section title="Terreno" icon={<Mountain className="text-lime-400" />}>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2.5" title={elev.note ?? undefined}>
                  <div>
                    <span className="text-2xs font-bold uppercase text-zinc-400">Altitude</span>
                    <span className="block text-xl font-black tabular-nums text-white">
                      {isMdt ? fmt(elev.meters, 1) : `≈ ${Math.round(elev.meters)}`}<small className="ml-0.5 text-2xs text-zinc-400">m</small>
                    </span>
                  </div>
                  <span className="max-w-[55%] text-right text-2xs leading-snug text-zinc-400">
                    {isMdt ? 'MDT do PE3D (grade de 5 m) · cota relativa' : 'aproximada · Open-Meteo (90 m), fora da área do MDT'}
                  </span>
                </div>
              </Section>
            )}

            {/* 4. Tempo agora */}
            <Section title="Tempo agora" icon={<Thermometer className="text-orange-400" />}>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Temp." value={fmt(p.temperature)} unit={p.unitTemperature || '°C'} icon={<Thermometer className="text-orange-400" />} />
                <Stat label="Umidade" value={fmt(p.humidity, 0)} unit="%" icon={<Droplets className="text-blue-400" />} />
                <Stat label="Vento" value={fmt(p.windSpeed)} unit={p.unitWindSpeed || 'km/h'} icon={<Wind className="text-slate-300" />} />
                <Stat label="Pressão" value={fmt(p.pressure, 0)} unit={p.unitPressure || 'hPa'} icon={<Gauge className="text-emerald-400" />} />
                <Stat label="Radiação" value={fmt(p.solarRadiation, 0)} unit={p.unitSolarRadiation || 'W/m²'} icon={<Sun className="text-yellow-400" />} />
              </div>
            </Section>

            {/* 5. Sensores no raio */}
            {readings.length > 0 && (
              <Section title="Sensores no raio de 3 km" icon={<Activity className="text-emerald-400" />}
                aside={<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-2xs font-black uppercase tracking-widest text-emerald-500">{readings.length}</span>}>
                <ul className="m-0 list-none space-y-1.5 p-0">
                  {[...readings].sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)).map((r) => (
                    <li key={`${r.sensorId}-${r.type}`}>
                      <button type="button" onClick={() => onSensorSelect(r)} title={r.sensorId}
                        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-white/5">
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-white">{r.sensorId}</span>
                          <span className="text-2xs text-zinc-400">{READING_LABEL[r.type] ?? r.type} · {fmt(r.distanceKm, 1)} km</span>
                        </span>
                        <span className="shrink-0 text-sm font-black tabular-nums text-white">
                          {fmt(r.value, r.type === 'RIVER_LEVEL' ? 2 : 1)}<small className="ml-0.5 text-2xs text-zinc-400">{r.unit}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>

      {/* Ação fixa no rodapé */}
      {!loading && p && (
        <footer className="shrink-0 border-t border-white/5 bg-zinc-900/95 px-4 py-3">
          <Button onClick={onReport}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-600/20 text-2xs font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-600 hover:text-white">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Reportar alagamento aqui
          </Button>
        </footer>
      )}
    </section>
  );
};
