import { sensorService } from './sensor.service';
import { floodService } from './flood.service';
import { tideService } from './tide.service';
import { weatherService } from './weather.service';
import { marineService } from './marine.service';
import { exportService } from './export.service';
import { adminService } from './admin.service';

export const mapService = {
  ...sensorService,
  ...floodService,
  ...tideService,
  ...weatherService,
  ...marineService,
  ...exportService,
  ...adminService,
};

export * from './sensor.service';
export * from './flood.service';
export * from './tide.service';
export * from './weather.service';
export * from './marine.service';
export * from './export.service';
export * from './admin.service';
export * from '@/lib/api';
