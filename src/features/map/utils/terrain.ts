import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

/**
 * Camada de terreno (ADR 0008, C3): tiles PNG já coloridos, empacotados em um PMTiles estático
 * (gerado por `tools/terreno/run.sh tiles` no projeto-mapi-api) e lidos por range requests.
 * A paleta é aplicada na geração: os valores abaixo DEVEM repetir `tools/terreno/paleta_hipsometrica.txt`
 * (a legenda é gerada daqui). ADR 0009: só hipsometria (cota relativa do MDT, datum não confirmado).
 * Nada nesta camada compara cota com nível de água.
 */
export const TERRAIN_PMTILES_PATH = '/terrain/terrain_hypsometry.pmtiles';
export const TERRAIN_SOURCE_ID = 'terrain-hypsometry-source';
export const TERRAIN_LAYER_ID = 'terrain-hypsometry-layer';
export const TERRAIN_OPACITY = 0.7;

/** Cota (m) -> cor RGB; interpolação linear, igual à do gdaldem color-relief. Amarelo (baixo) a azul-índigo (alto). */
export const TERRAIN_COLOR_STOPS: ReadonlyArray<{ valueM: number; rgb: readonly [number, number, number] }> = [
  { valueM: 0, rgb: [246, 208, 77] },
  { valueM: 2, rgb: [249, 160, 63] },
  { valueM: 4, rgb: [242, 107, 56] },
  { valueM: 6, rgb: [217, 63, 91] },
  { valueM: 9, rgb: [168, 50, 125] },
  { valueM: 13, rgb: [106, 44, 145] },
  { valueM: 20, rgb: [46, 42, 122] },
];
export const TERRAIN_MIN_M = TERRAIN_COLOR_STOPS[0].valueM;
/** Acima de TERRAIN_MAX_M a cor satura (a legenda diz "20+"). */
export const TERRAIN_MAX_M = TERRAIN_COLOR_STOPS[TERRAIN_COLOR_STOPS.length - 1].valueM;
/** Cotas rotuladas na legenda (m). */
export const TERRAIN_LEGEND_TICKS_M = [0, 5, 10, 20] as const;

let protocolRegistered = false;

/** Registra o protocolo `pmtiles://` uma única vez (addProtocol é global do maplibre-gl). */
export function ensurePmtilesProtocol(): void {
  if (protocolRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  protocolRegistered = true;
}

export function terrainSourceUrl(origin: string = window.location.origin): string {
  return `pmtiles://${origin}${TERRAIN_PMTILES_PATH}`;
}

/** Cor (RGB) da paleta para uma cota, com saturação nas pontas. */
export function terrainColorAt(valueM: number): [number, number, number] {
  const st = TERRAIN_COLOR_STOPS;
  if (valueM <= st[0].valueM) return [...st[0].rgb];
  if (valueM >= st[st.length - 1].valueM) return [...st[st.length - 1].rgb];
  const j = st.findIndex((x) => x.valueM >= valueM);
  const a = st[j - 1];
  const b = st[j];
  const t = (valueM - a.valueM) / (b.valueM - a.valueM);
  return [0, 1, 2].map((k) => Math.round(a.rgb[k] + (b.rgb[k] - a.rgb[k]) * t)) as [number, number, number];
}

export interface TerrainLegendStop {
  valueM: number;
  /** `rgb(r, g, b)` da MESMA paleta usada na geração dos tiles. */
  color: string;
}

export function terrainLegendStops(): TerrainLegendStop[] {
  return TERRAIN_COLOR_STOPS.map(({ valueM, rgb }) => ({ valueM, color: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` }));
}

/** Estado de carregamento da camada, mostrado ao usuário e lido pela medição do ADR 0008. */
export type TerrainStatus = 'off' | 'loading' | 'ready' | 'error';
