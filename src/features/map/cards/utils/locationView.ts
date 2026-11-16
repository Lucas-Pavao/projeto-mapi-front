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

/** Aviso do topo, com os textos do protótipo (CardLocal): um por estado, nenhum na chuva medida. */
export function bannerOf(state: LocationState): Banner | null {
  switch (state) {
    case 'MEASURED': return null;
    case 'GAP': return { tone: 'warning', dashed: true, title: 'Sem chuva medida agora.', text: 'As estações válidas até 5 km estão sem dado nesta hora. A lacuna não vira zero e não é trocada por estimativa.' };
    case 'ESTIMATED': return { tone: 'warning', dashed: false, title: 'Nenhum pluviômetro válido até 5 km.', text: 'A chuva abaixo é estimada (Open-Meteo): suaviza picos e não entra em nenhuma previsão.' };
    case 'SEA': return { tone: 'muted', dashed: true, title: 'Ponto no mar.', text: 'Sem terreno nem pluviômetro. Mostramos só maré e tempo estimado.' };
    case 'OUTSIDE': return { tone: 'warning', dashed: false, title: 'Fora da área monitorada.', text: 'O MAPi cobre a Região Metropolitana do Recife. Chuva e tempo abaixo são estimativas de reanálise.' };
  }
}

export interface RainSourceTag { text: string; measured: boolean }

export function rainSourceTag(mode: RainMode): RainSourceTag {
  return mode === 'MEASURED' ? { text: 'medida · Cemaden', measured: true } : mode === 'GAP' ? { text: 'sem dado · Cemaden', measured: false } : { text: 'estimada · Open-Meteo', measured: false };
}

/** Nota sob os números da chuva (protótipo). */
export function rainNote(mode: RainMode): string {
  return mode === 'MEASURED' ? 'Vale o maior valor entre os pluviômetros válidos até 5 km, a mesma regra da chuva dos pontos críticos. Hora sem dado deixa o acumulado vazio.'
    : mode === 'GAP' ? 'Volta a aparecer quando a estação mandar a próxima leitura ou a PED preencher a hora.'
    : 'Reanálise horária: serve de referência, não de medição.';
}

export interface RainTile { label: string; value: string; unit: string; missing: boolean; first: boolean }

/**
 * Chuva agora/3 h/24 h. Ausente nunca vira 0: "incompleto" no acumulado de chuva MEDIDA com hora faltando; "sem dado" na
 * lacuna, na estimativa sem valor e no "agora".
 */
export function rainTiles(a: LocationAnalysis): RainTile[] {
  const acc = a.rain.mode === 'MEASURED' ? 'incompleto' : 'sem dado';
  const t = (label: string, v: number | null | undefined, unit: string, miss: string, first = false): RainTile => ({ label, value: v == null ? miss : num(v, 1), unit: v == null ? '' : unit, missing: v == null, first });
  return [t('Agora', a.rain.nowMmH, 'mm/h', 'sem dado', true), t('3 h', a.rain.acc3hMm, 'mm', acc), t('24 h', a.rain.acc24hMm, 'mm', acc)];
}

/** Valor e etiqueta da candidata na lista (protótipo): fora = motivo do mês; sem valor = "sem dado"; senão mm/h. */
export const CANDIDATE_TAG_CLASS: Record<LocationCandidate['role'], string> = {
  USED: 'text-primary', LOWER: 'text-muted-foreground', EXCLUDED: 'text-destructive', NO_VALUE: 'text-warning',
};

/** Estilo da linha do mapa até cada candidata: cheia = usada, tracejada = menor/sem valor, vermelha = reprovada. */
export type LineStyle = { color: string; dash: [number, number] | undefined; width: number };
export interface LinePalette { primary: string; destructive: string; muted: string }
export const DEFAULT_LINE_PALETTE: LinePalette = { primary: '#5cb8ff', destructive: '#d4373c', muted: '#8a9a9c' };

/** Cores do tema atual (variáveis CSS), para as linhas acompanharem tema e cor de destaque; sem DOM, as padrão. */
export function themeLinePalette(): LinePalette {
  if (typeof window === 'undefined') return DEFAULT_LINE_PALETTE;
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return { primary: v('--primary', DEFAULT_LINE_PALETTE.primary), destructive: v('--destructive', DEFAULT_LINE_PALETTE.destructive), muted: v('--muted-foreground', DEFAULT_LINE_PALETTE.muted) };
}

/** Protótipo: usada = cheia e mais grossa; menor/sem valor = tracejada neutra; reprovada = tracejada vermelha. */
export function lineStyleOf(c: Pick<LocationCandidate, 'role'>, p: LinePalette = DEFAULT_LINE_PALETTE): LineStyle {
  switch (c.role) {
    case 'USED': return { color: p.primary, dash: undefined, width: 2.5 };
    case 'EXCLUDED': return { color: p.destructive, dash: [4, 4], width: 1.5 };
    default: return { color: p.muted, dash: [4, 4], width: 1.5 };
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
