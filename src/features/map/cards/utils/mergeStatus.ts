import type { FloodPointResponseDTO, PreciseDataResponse } from '../../types';

/** Ponto com o status em tempo real por cima: as leituras mais novas vencem as da lista. */
export function mergeStatus(point: FloodPointResponseDTO, status: PreciseDataResponse | null | undefined): FloodPointResponseDTO {
  if (!status) return point;
  return {
    ...point,
    liveData: status.preciseData ?? point.liveData,
    tideHeight: status.preciseData?.tideHeightTabuaMare ?? point.tideHeight,
  };
}
