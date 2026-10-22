/** Arredonda a 3 casas (~110 m) antes de qualquer envio (ADR 0013): o app nunca manda a posição exata. */
export const roundCoord = (v: number): number => Math.round(v * 1000) / 1000;

/** Caixa da RMR aceita pelo endpoint (redesign-telas.yaml); fora dela a API responde 422. */
export const RMR_BOX = { latMin: -8.4, latMax: -7.8, lonMin: -35.2, lonMax: -34.8 } as const;

export const insideRmr = (lat: number, lon: number): boolean => lat >= RMR_BOX.latMin && lat <= RMR_BOX.latMax && lon >= RMR_BOX.lonMin && lon <= RMR_BOX.lonMax;

export type GeoFailure = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

/** Texto de erro de geolocalização do navegador, sem jargão. */
export function geoFailureText(f: GeoFailure): string {
  switch (f) {
    case 'denied': return 'Você não permitiu o acesso à localização. Libere nas configurações do navegador para este site e tente de novo.';
    case 'timeout': return 'A localização demorou demais. Vá para um lugar com sinal melhor e tente de novo.';
    case 'unsupported': return 'Este aparelho ou navegador não informa a localização.';
    default: return 'Não foi possível descobrir onde você está agora.';
  }
}
