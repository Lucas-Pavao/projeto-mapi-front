import type { AlertaPonto } from '../schemas/alerta.schema';

const mm = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
const cm = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }));

export const PHYSICAL_MODEL_LABEL = 'Estimativa do modelo físico, ainda não validada contra alagamento observado';

/** Título do destaque de chuva. SEM_DADO nunca vira "sem risco". Mapeamento exaustivo. */
export function rainTitle(a: AlertaPonto): string {
  switch (a.rainAlert) {
    case 'ALERTA':
      return 'Chuva acima do que a galeria escoa';
    case 'ATENCAO':
      return 'Chuva forte provável';
    case 'NENHUM':
      return 'Sem alerta de chuva';
    case 'SEM_DADO':
      return 'Sem dado suficiente agora';
    default: {
      const never: never = a.rainAlert;
      return never;
    }
  }
}

/** Mensagem do alerta de chuva, com o texto combinado no prompt. Nenhuma das duas promete alagamento. */
export function rainMessage(a: AlertaPonto, ponto: string): string {
  switch (a.rainAlert) {
    case 'ATENCAO':
      return `Chuva forte provável nos próximos 20 a 60 min em ${ponto}. Chuva agora: ${mm(a.rainTeMm)} mm em 10 min.`;
    case 'ALERTA':
      return `Chuva acima do que a galeria escoa em ${ponto}.`;
    case 'NENHUM':
      return `Chuva agora: ${mm(a.rainTeMm)} mm em 10 min.`;
    case 'SEM_DADO':
      return `Sem dado suficiente agora: ${a.rainReasonText ?? a.rainReason ?? 'motivo não informado'}.`;
    default: {
      const never: never = a.rainAlert;
      return never;
    }
  }
}

/** Mensagem do nível do ponto (balde a 10 min). Sempre acompanhada da etiqueta do modelo físico. */
export function floodMessage(a: AlertaPonto, ponto: string): string {
  switch (a.pointFlood) {
    case 'PROVAVEL': {
      const agora = a.floodInMinutes === 0;
      const y = agora ? a.hNowCm : a.hProjQ50MaxCm;
      return `Alagamento provável em ${ponto}: lâmina estimada de ${cm(y)} cm ${agora ? 'agora' : `em até ${a.floodInMinutes} min`}.`;
    }
    case 'NAO':
      return `Lâmina estimada agora: ${cm(a.hNowCm)} cm (alagamento a partir de 15 cm).`;
    case 'SEM_DADO':
      return `Nível do ponto sem dado: ${a.floodReasonText ?? a.floodReason ?? 'motivo não informado'}.`;
    default: {
      const never: never = a.pointFlood;
      return never;
    }
  }
}

/** Faixa da lâmina projetada: mediana (q50) e quantil de 80%, nunca um número único. */
export function floodBand(a: AlertaPonto): string | null {
  if (a.hProjQ50MaxCm == null && a.hProjQ80MaxCm == null) return null;
  return `Projeção em 60 min: ${cm(a.hProjQ50MaxCm)} cm (chuva prevista mediana) a ${cm(a.hProjQ80MaxCm)} cm (quantil de 80%).`;
}

export function ageText(a: AlertaPonto): string | null {
  if (a.latestReadingAgeMinutes == null) return null;
  return `leitura de ${Math.round(a.latestReadingAgeMinutes)} min atrás`;
}
