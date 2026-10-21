import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsService } from '../services/events.service';

/** Janela das últimas `hours` horas, fixada na montagem (chave de cache estável). */
export function useTimeline(hours = 24) {
  const [range] = useState(() => {
    const to = new Date();
    to.setMinutes(0, 0, 0);
    return { from: new Date(to.getTime() - hours * 3_600_000).toISOString(), to: to.toISOString() };
  });
  return useQuery({ queryKey: ['events', 'timeline', range], queryFn: () => eventsService.timeline(range.from, range.to) });
}
