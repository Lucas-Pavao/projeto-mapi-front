import { fmtNum } from './overview';
import { formatRecife } from './datetime';
import type { StationAccumulation } from '../schemas/measuredRain.schema';
import type { SensorResponseDTO } from '../types';

/** Citação exigida pelo Cemaden onde os dados dele aparecem. */
export const CEMADEN_ATTRIBUTION = 'DADOS DA REDE OBSERVACIONAL DO CEMADEN/MCTIC';

/**
 * Três estados distintos, nunca confundidos:
 * - `value`: choveu e mediu (> 0 mm);
 * - `zero`: mediu e não choveu (0 mm);
 * - `no-data`: a estação não mediu na janela (acumulado nulo). Não é zero de chuva.
 */
export type MeasuredKind = 'value' | 'zero' | 'no-data';

export function measuredKind(mmValue: number | null | undefined): MeasuredKind {
  if (mmValue == null) return 'no-data';
  return mmValue === 0 ? 'zero' : 'value';
}

/** Texto do rótulo de 3 h: "12,4 mm", "0,0 mm" ou "sem dado". */
export function measuredText(mmValue: number | null | undefined): string {
  return mmValue == null ? 'sem dado' : `${fmtNum(mmValue)} mm`;
}

/** Hora local de Recife com a referência explícita: o dado chega em UTC. */
export function recifeWithReference(iso: string | null | undefined): string | null {
  const local = formatRecife(iso);
  return local ? `${local} (horário de Recife, UTC−3)` : null;
}

/** Estações canônicas com coordenada (as que a PED devolve fora do cadastro do MAPi não vão para o mapa). */
export function mappableStations(stations: readonly StationAccumulation[]): StationAccumulation[] {
  return stations.filter((s) => s.canonicalId != null && s.lat != null && s.lon != null);
}

/** Códigos da coleta ao vivo (apelidos `CEMADEN:<código>`) já representados por uma estação canônica. */
export function liveAliasCodes(stations: readonly StationAccumulation[]): Set<string> {
  const codes = new Set<string>();
  for (const s of stations) {
    for (const a of s.aliases) if (a.startsWith('CEMADEN:')) codes.add(a.slice('CEMADEN:'.length));
  }
  return codes;
}

/**
 * Com a camada de chuva medida ligada, o pluviômetro da coleta ao vivo que já é apelido de uma estação canônica sai do
 * mapa: uma estação física, um marcador. Os apelidos aparecem no detalhe da estação.
 */
export function withoutCanonicalDuplicates(sensors: SensorResponseDTO[], aliasCodes: ReadonlySet<string>): SensorResponseDTO[] {
  if (aliasCodes.size === 0) return sensors;
  return sensors.filter((s) => !(s.source === 'APAC/Cemaden' && s.code != null && aliasCodes.has(s.code)));
}
