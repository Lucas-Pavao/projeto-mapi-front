import type { SensorResponseDTO } from '../types';
import type { PreciseData } from '../types';

/**
 * Rastreabilidade do painel (PRONTIDAO-ACADEMICA §3, F4-FRONT-01c): cada número mostra a grandeza
 * e a fonte reais. Nunca rotula como "24 h" uma grandeza que não é de 24 h.
 */

export interface RainReading {
  value: number | null;
  unit: string;
  /** Grandeza, ex.: "Chuva 24 h". */
  quantity: string;
  /** Fonte, ex.: "pluviômetro Cemaden". */
  source: string;
}

export const NO_RAIN_READING: RainReading = {
  value: null,
  unit: 'mm',
  quantity: 'Chuva — sem dado',
  source: 'nenhuma fonte com valor',
};

const SOURCE_NAMES: Record<string, string> = {
  CEMADEN: 'Cemaden',
  APAC: 'APAC',
  ANA: 'ANA',
  INMET: 'Inmet',
};

export const sourceName = (raw: string | null | undefined): string | null => {
  const s = raw?.trim();
  if (!s) return null;
  return SOURCE_NAMES[s.toUpperCase()] ?? s;
};

interface RainInput {
  precise?: PreciseData | null;
  sensor?: SensorResponseDTO | null;
  openMeteoPrecipitation?: number | null;
}

/**
 * Mesma ordem de preferência de antes (agregado 24 h, chuva do dado preciso, sensor mais próximo,
 * Open-Meteo), mas cada degrau diz o que é. O acumulado do sensor e a chuva do dado preciso não
 * trazem janela na API, então não são rotulados como 24 h.
 */
export const resolveRain = ({ precise, sensor, openMeteoPrecipitation }: RainInput): RainReading => {
  const unit = precise?.unitPrecipitation || 'mm';
  const agg = precise?.historicalAggregates?.rain24h;
  if (agg != null) {
    return { value: agg, unit, quantity: 'Chuva 24 h', source: sourceName(precise?.source) ?? 'fonte não informada pela API' };
  }
  if (precise?.precipitation != null) {
    return {
      value: precise.precipitation,
      unit,
      quantity: 'Chuva (janela não informada)',
      source: sourceName(precise.source) ?? 'fonte não informada pela API',
    };
  }
  if (sensor?.accumulatedPrecipitation != null) {
    const who = sourceName(sensor.source);
    return {
      value: sensor.accumulatedPrecipitation,
      unit,
      quantity: 'Chuva acumulada (janela não informada)',
      source: `pluviômetro${who ? ` ${who}` : ''}${sensor.stationName ? ` — ${sensor.stationName}` : ''}`,
    };
  }
  if (openMeteoPrecipitation != null) {
    return { value: openMeteoPrecipitation, unit: 'mm', quantity: 'Chuva na última hora', source: 'Open-Meteo' };
  }
  return NO_RAIN_READING;
};

export const TIDE_UNIT = 'm (NR da DHN)';
export const TIDE_NOTE = 'Altura em relação ao Nível de Redução (NR) da DHN. Não é comparável à cota do terreno, que está em outro datum.';

export const fmtPt = (v: number, decimals: number): string =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export interface AreaRange {
  min: number;
  max: number;
}

/** Faixa da área contribuinte para snap de 5, 10 e 20 m (RC-18). Null se a API não a expõe. */
export const snapAreaRange = (bySnap: Record<string, number | null> | undefined, area: number | null | undefined): AreaRange | null => {
  if (!bySnap) return null;
  const vals = ['5m', '10m', '20m'].map((k) => bySnap[k]).filter((v): v is number => typeof v === 'number');
  if (area != null) vals.push(area);
  if (vals.length < 2) return null;
  return { min: Math.min(...vals), max: Math.max(...vals) };
};
