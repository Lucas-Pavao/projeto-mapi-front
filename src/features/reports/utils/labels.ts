import type { Severity } from '@/lib/apiSchemas';
import type { WaterDepth } from '../schemas/report.schema';

/** Gravidade observada do alagamento (FloodEvent.Severity). Não é a classe de risco do modelo. */
export const SEVERITY_LABEL: Record<Severity, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', CRITICAL: 'Crítica' };

export const WATER_DEPTH_LABEL: Record<WaterDepth, string> = {
  ANKLE: 'Até o tornozelo',
  KNEE: 'Até o joelho',
  WAIST: 'Até a cintura',
  ABOVE_WAIST: 'Acima da cintura',
};
