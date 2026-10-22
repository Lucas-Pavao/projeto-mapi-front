import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '../services/predictions.service';

/** Previsões das últimas `hours` h até agora (janela fixada na montagem: chave de cache estável; máximo de 7 dias na API). */
export function usePredictionSeries(slug: string, hours = 24) {
  const [range] = useState(() => {
    const to = new Date();
    return { from: new Date(to.getTime() - hours * 3_600_000).toISOString(), to: to.toISOString() };
  });
  return useQuery({ queryKey: ['points', slug, 'predictions', range], queryFn: () => predictionsService.series(slug, range.from, range.to), enabled: slug !== '' });
}
