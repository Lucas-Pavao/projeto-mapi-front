import { num } from '@/features/operacao/utils/format';
import type { FloodPointResponseDTO } from '../../types';

export const ANALYSIS_TABS = ['why', 'inputs', 'prov'] as const;
export type AnalysisTab = (typeof ANALYSIS_TABS)[number];
export const TAB_LABEL: Record<AnalysisTab, string> = { why: 'Por quê', inputs: 'Entradas', prov: 'Origem' };

/** Aba da URL (?aba=): valor fora da lista cai em "Por quê". */
export const parseTab = (v: string | null | undefined): AnalysisTab => (ANALYSIS_TABS as readonly string[]).includes(v ?? '') ? (v as AnalysisTab) : 'why';

export interface InputTile { id: string; label: string; value: string; sub: string; missing: boolean; imputed: boolean }

/** Entradas do modelo agora, lidas do ponto. Valor ausente fica "—" (nunca 0); feature imputada é declarada. */
export function inputTiles(point: FloodPointResponseDTO, imputedIds: ReadonlySet<string>): InputTile[] {
  const d = point.liveData;
  const agg = d?.historicalAggregates;
  const tide = point.tideHeight ?? d?.tideHeight ?? null;
  const mk = (id: string, label: string, v: number | null | undefined, unit: string, sub: string, digits = 1): InputTile => ({
    id, label, value: imputedIds.has(id) ? 'imputado' : v == null ? '—' : `${num(v, digits)} ${unit}`, sub: imputedIds.has(id) ? 'faltou hora na janela' : v == null ? 'sem leitura' : sub, missing: v == null, imputed: imputedIds.has(id),
  });
  return [
    mk('current_rainfall', 'Chuva atual', d?.precipitation, 'mm/h', 'estação mais próxima válida'),
    mk('rainfall_3h_accumulated', 'Chuva 3 h', agg?.rain3h, 'mm', 'medida · Cemaden'),
    mk('rainfall_6h_accumulated', 'Chuva 6 h', agg?.rain6h, 'mm', 'medida · Cemaden'),
    mk('rainfall_24h_accumulated', 'Chuva 24 h', agg?.rain24h, 'mm', 'medida · Cemaden'),
    mk('tide_level', 'Maré', tide, 'm', point.tideUnit ?? 'DHN (NR)', 2),
    mk('altitude', 'Altitude do ponto', point.altitudeM, 'm', 'cadastro do ponto'),
    mk('distance_to_channel', 'Até o canal', point.distanceToChannelM, 'm', 'cadastro do ponto', 0),
  ];
}
