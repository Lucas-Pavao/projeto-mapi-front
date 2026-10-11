import { useState, useEffect, useCallback } from 'react';
import { sensorService } from '../services/sensor.service';
import { floodService } from '../services/flood.service';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';

export const useMapData = (pollingInterval = 30000) => {
  const [sensors, setSensors] = useState<SensorResponseDTO[]>([]);
  const [floodPoints, setFloodPoints] = useState<FloodPointResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  /** ISO-8601 (UTC) da última resposta completa e válida; null se nunca houve. */
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [sensorsData, floodPointsData] = await Promise.all([
        sensorService.getLatestSensors(),
        floodService.getAllFloodPoints()
      ]);
      
      setSensors(Array.isArray(sensorsData) ? sensorsData : []);
      setFloodPoints(Array.isArray(floodPointsData) ? floodPointsData : []);
      setHasError(false);
      setLastSuccessAt(new Date().toISOString());
    } catch (error: unknown) {
      // Mantém os últimos dados em tela (sensors/floodPoints não são zerados) e sinaliza a falha.
      console.error('Erro ao buscar dados do mapa:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    const initFetch = async () => {
      await fetchData();
    };
    initFetch();
    
    // Polling
    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval, fetchData]);

  return { sensors, floodPoints, isLoading, isRefreshing, hasError, lastSuccessAt, refetch: fetchData };
};
