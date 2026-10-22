import { useEffect } from 'react';
import { loadFloodPointStatus } from '../utils/floodPointStatus';
import type { NoticeKind } from '@/hooks/useNotices';
import type { FloodPointResponseDTO, PreciseDataResponse } from '../types';

interface Options {
  point: FloodPointResponseDTO | undefined;
  setStatus: (status: PreciseDataResponse | null) => void;
  setIsFetching: (fetching: boolean) => void;
  notify: (kind: NoticeKind, message: string) => unknown;
}

/** Busca o status em tempo real quando um ponto crítico é selecionado; limpa ao trocar ou desmontar. */
export function useFloodPointStatus({ point, setStatus, setIsFetching, notify }: Options) {
  const slug = point?.slug;
  const latitude = point?.latitude;
  const longitude = point?.longitude;
  useEffect(() => {
    if (!slug || latitude == null || longitude == null) return;
    let isMounted = true;
    const run = async () => {
      setIsFetching(true);
      try {
        const data = await loadFloodPointStatus({ slug, latitude, longitude }, () => isMounted);
        if (isMounted) setStatus(data);
      } catch (error) {
        console.error('Erro ao buscar status do ponto:', error);
        if (isMounted) notify('error', 'Não foi possível carregar o status em tempo real deste ponto. Os dados exibidos podem estar incompletos.');
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };
    void run();
    return () => {
      isMounted = false;
      setStatus(null);
    };
  }, [slug, latitude, longitude, setIsFetching, setStatus, notify]);
}
