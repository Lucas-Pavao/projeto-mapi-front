import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';

interface Sources {
  locationInfo: PreciseDataResponse | null;
  floodPointStatus: PreciseDataResponse | null;
  selectedFloodPoint: FloodPointResponseDTO | undefined;
  sensorStatus: PreciseDataResponse | null;
}

/** Ids de sensores próximos ao que está selecionado (local clicado, ponto ou sensor). */
export function collectNearbySensorIds({ locationInfo, floodPointStatus, selectedFloodPoint, sensorStatus }: Sources): Set<string> {
  const ids = new Set<string>();
  const fromStatus = (s: PreciseDataResponse | null) => {
    s?.preciseData?.sensorIds?.forEach((id) => ids.add(id));
    s?.preciseData?.latestReadings?.forEach((d) => ids.add(d.sensorId));
  };
  // From clicked location info
  fromStatus(locationInfo);
  // From selected flood point status
  fromStatus(floodPointStatus);
  // From selected flood point itself
  selectedFloodPoint?.nearbySensorIds?.forEach((id) => ids.add(id));
  // From selected sensor status
  fromStatus(sensorStatus);
  return ids;
}
