import { useState, useEffect, useCallback } from 'react';
import { sensorService } from '../services/sensor.service';
import { floodService } from '../services/flood.service';
import type { SensorResponseDTO, FloodPointResponseDTO } from '../types';

export const useMapData = (pollingInterval = 30000) => {
  const [sensors, setSensors] = useState<SensorResponseDTO[]>([]);
  const [floodPoints, setFloodPoints] = useState<FloodPointResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sensorsData, floodPointsData] = await Promise.all([
        sensorService.getLatestSensors(),
        floodService.getAllFloodPoints()
      ]);
      
      setSensors(Array.isArray(sensorsData) ? sensorsData : []);
      setFloodPoints(Array.isArray(floodPointsData) ? floodPointsData : []);
    } catch (error: unknown) {
      console.error('Erro ao buscar dados do mapa:', error);
      if (error instanceof Error && error.message === 'Network Error') {
        console.warn('Backend (localhost:8080) parece estar offline ou inacessível.');
      }
    } finally {
      setIsLoading(false);
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

  return { sensors, floodPoints, isLoading, refetch: fetchData };
};
