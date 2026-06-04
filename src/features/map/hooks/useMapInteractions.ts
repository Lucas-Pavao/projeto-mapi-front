import { useState, useMemo } from 'react';
import type { MapMouseEvent } from 'maplibre-gl';
import { floodService } from '../services/flood.service';
import { tideService } from '../services/tide.service';
import type { 
  SensorResponseDTO, 
  FloodPointResponseDTO, 
  PreciseDataResponse
} from '../types';

export const useMapInteractions = (sensors: SensorResponseDTO[], floodPoints: FloodPointResponseDTO[]) => {
  const [selectedSensorId, setSelectedSensorId] = useState<number>();
  const [selectedFloodPointId, setSelectedFloodPointId] = useState<number>();
  const [showDetailCard, setShowDetailCard] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationInfo, setLocationInfo] = useState<PreciseDataResponse | null>(null);
  const [nearestHarbor, setNearestHarbor] = useState<Record<string, unknown> | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [floodPointStatus, setFloodPointStatus] = useState<PreciseDataResponse | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  const selectedSensor = useMemo(() => 
    (sensors || []).find(s => s.id === selectedSensorId),
    [sensors, selectedSensorId]
  );

  const selectedFloodPoint = useMemo(() => 
    (floodPoints || []).find(p => p.id === selectedFloodPointId),
    [floodPoints, selectedFloodPointId]
  );

  const handleMapClick = async (e: MapMouseEvent) => {
    if ((e.originalEvent?.target as HTMLElement)?.closest('.maplibregl-marker')) {
      return;
    }

    const { lng, lat } = e.lngLat;
    setClickedLocation({ lat, lng });
    setSelectedSensorId(undefined);
    setSelectedFloodPointId(undefined);
    setIsFetchingLocation(true);
    setLocationInfo(null);
    setNearestHarbor(null);
    
    try {
      const [data, harborData] = await Promise.all([
        floodService.getPreciseData(lat, lng),
        tideService.getNearestHarbor(lat, lng)
      ]);
      setLocationInfo(data);
      if (harborData && !harborData.error) {
        setNearestHarbor(harborData.data);
      }
    } catch (error) {
      console.error('Erro ao buscar informações do local:', error);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSensorClick = (sensor: SensorResponseDTO) => {
    setSelectedSensorId(sensor.id);
    setSelectedFloodPointId(undefined);
    setClickedLocation(null);
  };

  const handleFloodPointClick = (point: FloodPointResponseDTO) => {
    setSelectedFloodPointId(point.id);
    setSelectedSensorId(undefined);
    setClickedLocation(null);
  };

  const closePopups = () => {
    setSelectedSensorId(undefined);
    setSelectedFloodPointId(undefined);
    setClickedLocation(null);
    setLocationInfo(null);
    setNearestHarbor(null);
  };

  return {
    selectedSensorId,
    setSelectedSensorId,
    selectedFloodPointId,
    setSelectedFloodPointId,
    selectedSensor,
    selectedFloodPoint,
    showDetailCard,
    setShowDetailCard,
    clickedLocation,
    setClickedLocation,
    locationInfo,
    setLocationInfo,
    nearestHarbor,
    setNearestHarbor,
    isFetchingLocation,
    setIsFetchingLocation,
    floodPointStatus,
    setFloodPointStatus,
    isFetchingStatus,
    setIsFetchingStatus,
    handleMapClick,
    handleSensorClick,
    handleFloodPointClick,
    closePopups
  };
};
