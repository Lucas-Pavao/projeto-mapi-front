import type { FloodPointResponseDTO } from '@/features/map/types';
import type { PredictionSummary } from '../schemas/prediction.schema';

/**
 * Aplica uma previsão chegada pelo stream ao ponto, só se for mais nova que a que ele já tem
 * (a lista é paginada por polling e pode chegar depois do evento). Devolve o mesmo objeto se nada muda.
 */
export function applyPredictionToPoint(point: FloodPointResponseDTO, p: PredictionSummary): FloodPointResponseDTO {
  if (point.slug !== p.slug) return point;
  const current = point.floodPrediction?.issuedAt;
  if (current && Date.parse(current) > Date.parse(p.issuedAt)) return point;
  return {
    ...point,
    floodPrediction: {
      ...point.floodPrediction,
      riskLevel: p.riskLevel,
      floodProbability: p.riskLevel === 'UNKNOWN' ? null : (p.probability ?? null),
      issuedAt: p.issuedAt,
      validUntil: p.validUntil ?? null,
      horizonHours: p.horizonHours ?? null,
      modelVersion: p.modelVersion ?? null,
      degradationReason: p.degradationReason ?? null,
      lastValidIssuedAt: p.lastValidIssuedAt ?? null,
      modelValidationStatus: p.modelValidationStatus,
    },
  };
}
