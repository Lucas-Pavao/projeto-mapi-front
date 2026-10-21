/** Distância em metros entre duas coordenadas (haversine). */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Item mais próximo de `from` (com a distância em m), ou null se a lista estiver vazia. */
export function nearestTo<T extends { latitude: number; longitude: number }>(from: { lat: number; lng: number }, items: readonly T[]): { item: T; distanceM: number } | null {
  let best: { item: T; distanceM: number } | null = null;
  for (const item of items) {
    const d = distanceM(from, { lat: item.latitude, lng: item.longitude });
    if (!best || d < best.distanceM) best = { item, distanceM: d };
  }
  return best;
}

/** "800 m" ou "1,2 km". */
export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}
