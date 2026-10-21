import React from 'react';
import { MapPopup } from '@/components/ui/map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { SensorPopup } from './SensorPopup';
import { FloodPointPopup } from './FloodPointPopup';
import type { SensorResponseDTO, FloodPointResponseDTO, PreciseDataResponse } from '../types';

interface Props {
  isMobile: boolean;
  selectedSensor: SensorResponseDTO | undefined;
  sensorStatus: PreciseDataResponse | null;
  selectedFloodPoint: FloodPointResponseDTO | undefined;
  floodPointStatus: PreciseDataResponse | null;
  isFetchingStatus: boolean;
  onShowDetails: () => void;
  onClose: () => void;
}

const POPUP_CLASS = 'p-0 border-none shadow-none bg-transparent max-w-none';

/** Popup do MapLibre (desktop) ou folha inferior (celular) do sensor e do ponto crítico selecionados. */
export const MapSelectionPopups: React.FC<Props> = ({
  isMobile, selectedSensor, sensorStatus, selectedFloodPoint, floodPointStatus, isFetchingStatus, onShowDetails, onClose,
}) => (
  <>
    {selectedSensor && selectedSensor.latitude != null && selectedSensor.longitude != null && (
      isMobile ? (
        <BottomSheet title="Sensor" srTitle={selectedSensor.stationName || selectedSensor.sensorId} onClose={onClose}>
          <SensorPopup sensor={selectedSensor} status={sensorStatus} isFetchingStatus={isFetchingStatus} onShowDetails={onShowDetails} variant="sheet" />
        </BottomSheet>
      ) : (
        <MapPopup
          longitude={selectedSensor.longitude}
          latitude={selectedSensor.latitude}
          onClose={onClose}
          className={POPUP_CLASS}
          offset={[0, -60]}
          anchor="bottom"
          autoPan
          label={`Detalhes do sensor ${selectedSensor.stationName || selectedSensor.sensorId}`}
        >
          <SensorPopup sensor={selectedSensor} status={sensorStatus} isFetchingStatus={isFetchingStatus} onShowDetails={onShowDetails} />
        </MapPopup>
      )
    )}

    {/* Celular: o ponto crítico abre a folha MobilePointSheet (no MapView). */}
    {selectedFloodPoint && !isMobile && (
      <MapPopup
        longitude={selectedFloodPoint.longitude}
        latitude={selectedFloodPoint.latitude}
        onClose={onClose}
        className={POPUP_CLASS}
        offset={[34, 0]}
        anchor="left"
        label={`Detalhes do ponto crítico ${selectedFloodPoint.name}`}
      >
        <FloodPointPopup point={selectedFloodPoint} status={floodPointStatus} isFetchingStatus={isFetchingStatus} onClose={onClose} />
      </MapPopup>
    )}
  </>
);
