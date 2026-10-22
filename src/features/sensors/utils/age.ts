/** "há 5 min", "há 3 h", "há 2 dias" a partir de segundos. Negativo ou inválido vira "agora". */
export function formatAge(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 60) return 'agora';
  const min = Math.floor(seconds / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} dias`;
}

export const SENSOR_TYPE_LABEL = { PRECIPITATION: 'Chuva', RIVER_LEVEL: 'Nível do rio' } as const;
/** Unidade padrão por tipo quando a API não informa `unit` (contrato: chuva em mm, rio em m). */
export const SENSOR_TYPE_UNIT = { PRECIPITATION: 'mm', RIVER_LEVEL: 'm' } as const;
