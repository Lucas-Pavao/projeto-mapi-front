import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictions.service';

export function usePredictionSeries(slug: string, hours = 24) {
  const [range] = useState(() => {
    const to = new Date();
    to.setMinutes(0, 0, 0);
    return { from: new Date(to.getTime() - hours * 3_600_000).toISOString(), to: to.toISOString() };
  });
  return useQuery({ queryKey: ['points', slug, 'predictions', range], queryFn: () => predictionsService.series(slug, range.from, range.to) });
}
