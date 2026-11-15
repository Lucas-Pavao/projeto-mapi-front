import { num } from '@/features/operacao/utils/format';
import type { LocationAnalysis, LocationCandidate, RainMode } from '../schemas/locationAnalysis.schema';

/** Os 5 estados do card: chuva medida, lacuna, estimada, mar e fora da área. Mar e fora da área vencem o modo da chuva. */
export type LocationState = 'MEASURED' | 'GAP' | 'ESTIMATED' | 'SEA' | 'OUTSIDE';

export function locationState(a: Pick<LocationAnalysis, 'isSea' | 'inArea'> & { rain: { mode: RainMode } }): LocationState {
  if (a.isSea) return 'SEA';
  if (!a.inArea) return 'OUTSIDE';
  return a.rain.mode;
}

export interface Banner { tone: 'warning' | 'muted' | 'primary'; dashed: boolean; title: string; text: string }

export function bannerOf(state: LocationState, a: LocationAnalysis): Banner | null {
  switch (state) {
    case 'MEASURED': return null;
    case 'GAP': return { tone: 'warning', dashed: false, title: 'Estações válidas sem dado nesta hora.', text: 'O valor fica "sem dado": não é trocado por estimativa nem vira zero.' };
    case 'ESTIMATED': return { tone: 'primary', dashed: true, title: 'Sem pluviômetro até 5 km.', text: 'A chuva abaixo é estimada pela reanálise (Open-Meteo), não medida.' };
    case 'SEA': return { tone: 'muted', dashed: false, title: 'Local no mar.', text: 'Sem chuva medida nem terreno: só maré, tempo e o ponto mais próximo.' };
    case 'OUTSIDE': return { tone: 'warning', dashed: true, title: 'Fora da área monitorada.', text: `Fora da RMR: sem terreno e sem relato${a.rain.mode === 'ESTIMATED' ? '; a chuva é estimada' : ''}.` };
  }
}

export interface RainSourceTag { text: string; tone: 'success' | 'warning' | 'primary' }

export function rainSourceTag(mode: RainMode): RainSourceTag {
  return mode === 'MEASURED' ? { text: 'medida · Cemaden', tone: 'success' } : mode === 'GAP' ? { text: 'sem dado', tone: 'warning' } : { text: 'estimada · Open-Meteo', tone: 'primary' };
}

export interface RainTile { label: string; value: string; unit: string; missing: boolean }

/** Chuva agora/3 h/24 h. null = "sem dado" (lacuna) ou "—"; nunca 0. */
export function rainTiles(a: LocationAnalysis): RainTile[] {
  const miss = a.rain.mode === 'GAP' ? 'sem dado' : '—';
  const t = (label: string, v: number | null | undefined, unit: string): RainTile => ({ label, value: v == null ? miss : num(v, 1), unit: v == null ? '' : unit, missing: v == null });
  return [t('Agora', a.rain.nowMmH, 'mm/h'), t('3 h', a.rain.acc3hMm, 'mm'), t('24 h', a.rain.acc24hMm, 'mm')];
}

/** Estilo da linha do mapa até cada candidata: cheia = usada, tracejada = menor/sem valor, vermelha = reprovada. */
export type LineStyle = { color: string; dash: [number, number] | undefined; width: number };
export function lineStyleOf(c: Pick<LocationCandidate, 'role'>): LineStyle {
  switch (c.role) {
    case 'USED': return { color: '#5cb8ff', dash: undefined, width: 3 };
    case 'EXCLUDED': return { color: '#d4373c', dash: [2, 2], width: 2 };
    default: return { color: '#8a9a9c', dash: [4, 3], width: 2 };
  }
}

/** Polígono aproximado (em [lon, lat]) do círculo de `radiusM` m: para o círculo tracejado de 5 km. */
export function circleCoordinates(lat: number, lon: number, radiusM: number, steps = 72): Array<[number, number]> {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)];
  });
}

/** "-8,1039, -34,9509" na URL é "lat,lon" com ponto decimal. */
export const coordParam = (lat: number, lon: number) => `${lat.toFixed(4)},${lon.toFixed(4)}`;
export function parseCoordParam(v: string | null | undefined): { lat: number; lon: number } | null {
  const m = /^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/.exec(v ?? '');
  if (!m) return null;
  const lat = Number(m[1]), lon = Number(m[2]);
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ? { lat, lon } : null;
}
