import { floodService } from '../services/flood.service';
import { mapService } from '../services/map.service';
import { formatApiTimestamp } from './sensor';
import type { SensorResponseDTO, PreciseDataResponse } from '../types';

/** Ponto mínimo necessário para montar o status em tempo real. */
export interface StatusTarget {
  slug: string;
  latitude: number;
  longitude: number;
}

/**
 * Status em tempo real de um ponto crítico: junta o status do ponto (config de sensores), a análise
 * rica da coordenada (fallbacks) e as leituras individuais dos sensores próximos para preencher
 * métricas que ainda faltem. `isActive` é consultado antes da etapa dos sensores individuais para
 * abandonar o trabalho se a seleção mudou (mesmo comportamento do efeito original do MapView).
 */
export async function loadFloodPointStatus(point: StatusTarget, isActive: () => boolean = () => true): Promise<PreciseDataResponse> {
  // Fetch BOTH point status (for sensor config) and rich analysis (for fallbacks)
  const [pointData, preciseAnalysis] = await Promise.all([
    floodService.getPointStatus(point.slug),
    floodService.getPreciseData(point.latitude, point.longitude),
  ]);

  // Normalize data: FloodPointResponseDTO has liveData, MapiResponseDTO has preciseData.
  // We prioritize the point-specific liveData if available.
  const data: PreciseDataResponse = {
    ...preciseAnalysis,
    preciseData: pointData.liveData || preciseAnalysis.preciseData,
    floodPrediction: pointData.floodPrediction || preciseAnalysis.floodPrediction,
    // Keep nearestSensor and openMeteoData from preciseAnalysis as they are useful fallbacks
  };

  // Augment with individual sensor data if metrics are still missing
  if (isActive()) {
    const sensorIds = pointData.nearbySensorIds || [];
    if (sensorIds.length > 0) {
      const sensorReadings = await Promise.all(
        sensorIds.map(async (id) => {
          try {
            return await mapService.getLatestBySensorId(id);
          } catch {
            return null;
          }
        }),
      );

      const validSensors = sensorReadings.filter((s): s is SensorResponseDTO => s !== null);

      if (validSensors.length > 0) {
        if (!data.preciseData) {
          data.preciseData = {
            source: 'Individual sensors',
            timestamp: new Date().toISOString(),
            latestReadings: [],
            precipitation: null,
            temperature: null,
            humidity: null,
            pressure: null,
            windSpeed: null,
            waterLevel: null,
            flowRate: null,
            tideHeight: null,
            waveHeight: null,
            waveDirection: null,
            wavePeriod: null,
            tideHeightTabuaMare: null,
            solarRadiation: null,
            unitPrecipitation: null,
            unitTemperature: null,
            unitWaterLevel: null,
            unitTide: null,
            unitWave: null,
            unitWindSpeed: null,
            unitPressure: null,
            unitSolarRadiation: null,
            unitFlowRate: null,
            message: 'Dados consolidados via consulta individual.',
          };
        }

        // If the list of readings is empty, populate it
        if (!data.preciseData.latestReadings || data.preciseData.latestReadings.length === 0) {
          data.preciseData.latestReadings = validSensors.map((s) => ({
            sensorId: s.sensorId,
            value: s.value || 0,
            unit: s.unit || '',
            type: s.type || 'Sensor',
            timestamp: formatApiTimestamp(s.timestamp),
            latitude: s.latitude || 0,
            longitude: s.longitude || 0,
            distanceKm: 0,
          }));
        }

        // Backfill missing top-level metrics from individual sensors
        validSensors.forEach((s) => {
          if (data.preciseData.temperature == null) data.preciseData.temperature = s.temperature;
          if (data.preciseData.humidity == null) data.preciseData.humidity = s.humidity;
          if (data.preciseData.pressure == null) data.preciseData.pressure = s.pressure;
          if (data.preciseData.windSpeed == null) data.preciseData.windSpeed = s.windSpeed;
          if (data.preciseData.precipitation == null) data.preciseData.precipitation = s.accumulatedPrecipitation;
          if (data.preciseData.waterLevel == null) data.preciseData.waterLevel = s.waterLevel;
          if (data.preciseData.flowRate == null) data.preciseData.flowRate = s.flowRate;
          if (data.preciseData.tideHeight == null) data.preciseData.tideHeight = s.tideHeight ?? null;
        });
      }
    }
  }

  return data;
}
