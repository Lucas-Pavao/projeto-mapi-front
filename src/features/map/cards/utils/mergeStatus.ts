import type { FloodPointResponseDTO, PreciseDataResponse } from '../../types';

/** Ponto com o status em tempo real por cima: previsão e leituras mais novas vencem as da lista. */
export function mergeStatus(point: FloodPointResponseDTO, status: PreciseDataResponse | null | undefined): FloodPointResponseDTO {
  if (!status) return point;
  return {
    ...point,
    floodPrediction: status.floodPrediction ?? point.floodPrediction,
    liveData: status.preciseData ?? point.liveData,
    tideHeight: status.preciseData?.tideHeightTabuaMare ?? point.tideHeight,
  };
}
