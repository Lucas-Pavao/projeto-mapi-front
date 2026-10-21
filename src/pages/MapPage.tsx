import React from 'react';
import MapView from '@/features/map/components/MapView';

export const MapPage: React.FC = () => {
  return (
    <div className="absolute inset-0">
      <MapView />
    </div>
  );
};

export default MapPage;
