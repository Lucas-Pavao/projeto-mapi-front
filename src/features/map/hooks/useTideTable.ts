import { useQuery } from '@tanstack/react-query';
import { tideService } from '../services/tide.service';

export const useTideTable = (harbor = 'pe02') => useQuery({ queryKey: ['tide', harbor], queryFn: () => tideService.getTideTable(harbor) });
