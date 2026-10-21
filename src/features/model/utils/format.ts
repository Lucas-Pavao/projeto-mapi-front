/** Número com sinal explícito e sinal de menos tipográfico (−), em pt-BR. */
export const signed = (v: number, d = 3) => `${v < 0 ? '−' : '+'}${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
