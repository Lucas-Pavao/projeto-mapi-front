import React, { useEffect, useRef } from 'react';
import { useMap } from '@/components/ui/map';

/**
 * Pede a geolocalização do usuário quando o mapa carrega e voa até ela (se houver permissão).
 * Mantém um watchPosition para atualizar a posição; limpa no desmonte.
 */
export const LocationInitializer: React.FC<{ onLocationUpdate: (loc: { lat: number; lng: number }) => void }> = ({ onLocationUpdate }) => {
  const { map, isLoaded } = useMap();
  const hasInitialized = useRef(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (isLoaded && map && !hasInitialized.current) {
      hasInitialized.current = true;
      if ('geolocation' in navigator) {
        const watch = () => {
          watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
              onLocationUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => console.warn('Could not watch user location:', err.message),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
          );
        };
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onLocationUpdate({ lat: latitude, lng: longitude });
            map.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              duration: 2000,
            });
            watch();
          },
          (error) => {
            console.warn('Could not retrieve user location on initial load:', error.message || 'Unknown error');
            // Se falhar o getCurrentPosition, tenta o watchPosition mesmo assim
            watch();
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    }
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isLoaded, map, onLocationUpdate]);

  return null;
};
