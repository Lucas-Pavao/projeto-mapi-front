import { num } from '@/features/operacao/utils/format';
import type { FloodPointResponseDTO } from '@/features/map/types';
import type { RainCandidates } from '../schemas/rain-candidates.schema';
import { distanceText } from './rainCandidates';

export interface Tile { label: string; value: string; sub: string; tone?: string }

const SOURCE_LABEL: Record<string, string> = { OPEN_METEO_ARCHIVE: 'Open-Meteo', OPEN_METEO_FORECAST: 'Open-Meteo' };

/** Os 8 blocos de "Água e tempo agora", lidos de `liveData` do ponto. Sem leitura: "—" e "sem leitura". */
/** "Chuva agora" a partir das candidatas (B3): valor da hora e a estação usada com a distância; nunca 0 sem dado. */
function nowTile(rain: RainCandidates | undefined, fallback: Tile): Tile {
  if (!rain) return fallback;
  const used = rain.candidates.find((c) => c.stationId === rain.usedStationId);
  if (!used || rain.valueMm == null) return { label: 'Chuva agora', value: '—', sub: 'nenhuma estação com valor', tone: 'text-muted-foreground' };
  return { label: 'Chuva agora', value: `${num(rain.valueMm, 1)} mm/h`, sub: `${used.name} · ${distanceText(used.distanceM)}`, tone: rain.valueMm >= 25 ? 'text-risk-moderate-text' : undefined };
}

export function waterWeatherTiles(point: FloodPointResponseDTO | undefined, rain?: RainCandidates): Tile[] {
  const d = point?.liveData;
  const agg = d?.historicalAggregates;
  const rainUnit = d?.unitPrecipitation ?? 'mm';
  const withUnit = (v: number | null | undefined, unit: string, digits = 1) => (v == null ? '—' : `${num(v, digits)} ${unit}`);
  const rainSrc = agg?.rainSource ? (SOURCE_LABEL[agg.rainSource] ?? agg.rainSource) : 'sem leitura';
  const tide = d?.tideHeight ?? point?.tideHeight ?? null;
  return [
    nowTile(rain, { label: 'Chuva agora', value: withUnit(d?.precipitation, rainUnit), sub: d?.precipitation == null ? 'sem leitura' : 'pluviômetro mais próximo', tone: (d?.precipitation ?? 0) >= 30 ? 'text-risk-moderate-text' : undefined }),
    { label: 'Chuva 3 h', value: withUnit(agg?.rain3h, 'mm'), sub: agg?.rain3h == null ? 'sem leitura' : 'acumulado' },
    { label: 'Chuva 6 h', value: withUnit(agg?.rain6h, 'mm'), sub: agg?.rain6h == null ? 'sem leitura' : 'acumulado' },
    { label: 'Chuva 24 h', value: withUnit(agg?.rain24h, 'mm'), sub: rainSrc },
    { label: 'Maré', value: withUnit(tide, d?.unitTide ?? point?.tideUnit ?? 'm', 2), sub: tide == null ? 'sem leitura' : 'tábua da DHN (NR)' },
    { label: 'Rio', value: withUnit(d?.waterLevel, d?.unitWaterLevel ?? 'm', 2), sub: `${d?.waterLevel == null ? 'sem leitura' : 'nível mais recente'} · fora do modelo` },
    { label: 'Temperatura', value: withUnit(d?.temperature, '°C'), sub: d?.humidity == null ? 'sem leitura' : `umidade ${Math.round(d.humidity)}%` },
    { label: 'Ondas', value: withUnit(d?.waveHeight, d?.unitWave ?? 'm'), sub: d?.windSpeed == null ? 'sem leitura' : `vento ${Math.round(d.windSpeed)} ${d.unitWindSpeed ?? 'km/h'}` },
  ];
}
