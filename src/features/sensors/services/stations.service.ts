import api from '@/lib/api';
import { canonicalStationsSchema, stationHourlySchema, type CanonicalStation, type StationHourly } from '../schemas/station.schema';

export const stationsService = {
  async canonical(): Promise<CanonicalStation[]> {
    const { data } = await api.get<unknown>('/api/stations/canonical');
    return canonicalStationsSchema.parse(data);
  },
  /** Série horária de uma estação (B2). Janela de no máximo 7 dias. */
  async hourly(canonicalId: string, from: string, to: string): Promise<StationHourly> {
    const { data } = await api.get<unknown>(`/api/stations/${encodeURIComponent(canonicalId)}/hourly`, { params: { from, to } });
    return stationHourlySchema.parse(data);
  },
};
