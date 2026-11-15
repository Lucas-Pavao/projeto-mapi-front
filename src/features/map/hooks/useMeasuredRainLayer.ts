import { useMemo } from 'react';
import { useMeasuredRain } from './useMeasuredRain';
import { liveAliasCodes, mappableStations } from '../utils/measuredRain';

const NO_CODES: ReadonlySet<string> = new Set();

/** Dados da camada de chuva medida: estações com coordenada e códigos ao vivo que elas já representam. */
export function useMeasuredRainLayer(enabled: boolean) {
  const query = useMeasuredRain(enabled);
  const stations = useMemo(() => mappableStations(query.data?.stations ?? []), [query.data]);
  const aliasCodes = useMemo(() => (enabled ? liveAliasCodes(query.data?.stations ?? []) : NO_CODES), [enabled, query.data]);
  return { query, stations: enabled ? stations : [], aliasCodes };
}
