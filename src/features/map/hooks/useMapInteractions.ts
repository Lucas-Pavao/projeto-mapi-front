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
  const [manualSelectedSensor, setManualSelectedSensor] = useState<SensorResponseDTO | null>(null);
  const [manualSelectedFloodPoint, setManualSelectedFloodPoint] = useState<FloodPointResponseDTO | null>(null);
  const [showDetailCard, setShowDetailCard] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationInfo, setLocationInfo] = useState<PreciseDataResponse | null>(null);
  const [nearestHarbor, setNearestHarbor] = useState<Record<string, unknown> | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [floodPointStatus, setFloodPointStatus] = useState<PreciseDataResponse | null>(null);
  const [sensorStatus, setSensorStatus] = useState<PreciseDataResponse | null>(null);
  const [isFetchingStatus, setIsFetchingStatus] = useState(false);

  const selectedSensor = useMemo(() => 
    manualSelectedSensor || (sensors || []).find(s => s.id === selectedSensorId),
    [sensors, selectedSensorId, manualSelectedSensor]
  );

  const selectedFloodPoint = useMemo(() => 
    manualSelectedFloodPoint || (floodPoints || []).find(p => p.id === selectedFloodPointId),
    [floodPoints, selectedFloodPointId, manualSelectedFloodPoint]
  );

  const handleMapClick = async (e: MapMouseEvent) => {
    // Prevent click on map if we are clicking a marker
    if ((e.originalEvent?.target as HTMLElement)?.closest('.maplibregl-marker')) {
      return;
    }

    const { lng, lat } = e.lngLat;
    setClickedLocation({ lat, lng });
    setSelectedSensorId(undefined);
    setSelectedFloodPointId(undefined);
    setManualSelectedSensor(null);
    setManualSelectedFloodPoint(null);
    setIsFetchingLocation(true);
    setLocationInfo(null);
    setNearestHarbor(null);
    setSensorStatus(null);
    
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

  const handleSensorClick = async (sensor: SensorResponseDTO) => {
    const hasCoords = sensor.latitude != null && sensor.longitude != null && 
                     sensor.latitude !== 0 && sensor.longitude !== 0;

    // Set ID first to trigger popup logic in MapView
    setSelectedSensorId(sensor.id);
    setSelectedFloodPointId(undefined);
    setClickedLocation(null);
    
    // Then set manual state for the details
    setManualSelectedSensor(sensor);
    setManualSelectedFloodPoint(null);
    
    if (!hasCoords) {
      setShowDetailCard(true);
    } else {
      setShowDetailCard(false);
      // Fetch precise data for the sensor location
      setIsFetchingStatus(true);
      setSensorStatus(null);
      try {
        const data = await floodService.getPreciseData(sensor.latitude!, sensor.longitude!);
        setSensorStatus(data);
      } catch (error) {
        console.error('Erro ao buscar status do sensor:', error);
      } finally {
        setIsFetchingStatus(false);
      }
    }
  };

  const handleFloodPointClick = (point: FloodPointResponseDTO) => {
    const hasCoords = point.latitude != null && point.longitude != null && 
                     point.latitude !== 0 && point.longitude !== 0;

    // Set ID first to trigger popup logic in MapView
    setSelectedFloodPointId(point.id);
    setSelectedSensorId(undefined);
    setClickedLocation(null);

    // Then set manual state for the details
    setManualSelectedFloodPoint(point);
    setManualSelectedSensor(null);

    if (!hasCoords) {
      setShowDetailCard(true);
    } else {
      setShowDetailCard(false);
    }
  };

  const closePopups = () => {
    setSelectedSensorId(undefined);
    setSelectedFloodPointId(undefined);
    setManualSelectedSensor(null);
    setManualSelectedFloodPoint(null);
    setClickedLocation(null);
    setLocationInfo(null);
    setNearestHarbor(null);
    setSensorStatus(null);
    setFloodPointStatus(null);
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
    sensorStatus,
    setSensorStatus,
    isFetchingStatus,
    setIsFetchingStatus,
    handleMapClick,
    handleSensorClick,
    handleFloodPointClick,
    closePopups
  };
};
