/** Entrada manual de chuva: "5, 10; 20" ou uma hora por linha; decimal com vírgula colada (2,5) ou ponto. */
export function parseRainList(text: string): { values: number[]; error: string | null } {
  // "5, 10" (vírgula + espaço) separa; "2,5" (vírgula colada) é decimal pt-BR.
  const parts = text.replace(/,\s+/g, ' ').split(/[\s;]+/).filter(Boolean);
  const values: number[] = [];
  for (const p of parts) {
    const n = Number(p.replace(',', '.'));
    if (!Number.isFinite(n)) return { values: [], error: `“${p}” não é um número.` };
    values.push(n);
  }
  if (values.length === 0) return { values: [], error: 'Informe ao menos 1 hora de chuva.' };
  if (values.length > 72) return { values, error: 'Máximo de 72 horas.' };
  const bad = values.find((v) => v < 0 || v > 300);
  if (bad !== undefined) return { values, error: bad < 0 ? 'Chuva negativa não existe.' : 'Máximo de 300 mm/h por hora.' };
  return { values, error: null };
}

/** Chuva constante: `intensity` mm/h por `hours` horas. */
export function constantRain(intensity: number, hours: number): number[] {
  return Array.from({ length: Math.max(0, Math.min(72, Math.floor(hours))) }, () => intensity);
}

/** Chuva em pico no meio: perfil triangular com máximo `peak` mm/h, ao longo de `hours` horas. */
export function triangularRain(peak: number, hours: number): number[] {
  const n = Math.max(0, Math.min(72, Math.floor(hours)));
  const w = Array.from({ length: n }, (_, i) => 1 - Math.abs(i + 0.5 - n / 2) / (n / 2));
  const top = Math.max(...w, 0) || 1;
  return w.map((x) => Number(((peak * x) / top).toFixed(2)));
}

/** Completa a chuva com zeros até `horizon` horas (a chuva para e o modelo continua escoando). */
export function padRain(rain: number[], horizon: number): number[] {
  return rain.length >= horizon ? rain : [...rain, ...Array.from({ length: horizon - rain.length }, () => 0)];
}
