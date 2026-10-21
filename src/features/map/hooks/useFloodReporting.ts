import { useCallback, useState } from 'react';
import { exportService } from '../services/export.service';
import { reportsService } from '@/features/reports/services/reports.service';
import { actionErrorMessage } from '@/lib/apiError';
import type { NoticeKind } from '@/hooks/useNotices';
import type { ReportFormValues, ReportTarget } from '../components/ReportFloodModal';
import type { FloodPointResponseDTO } from '../types';

interface Options {
  notify: (kind: NoticeKind, message: string) => unknown;
}

/** Texto de erro de geolocalização, por código do navegador. */
function geolocationMessage(error: GeolocationPositionError): string {
  let msg = 'Não foi possível obter sua geolocalização. ';
  if (error.code === error.PERMISSION_DENIED) {
    msg += 'Permissão negada. Por favor, libere o acesso à localização nas configurações do seu navegador para este site.';
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    msg += 'A informação de localização está indisponível.';
  } else if (error.code === error.TIMEOUT) {
    msg += 'O tempo limite expirou ao tentar buscar a localização.';
  } else {
    msg += 'Verifique as permissões de geolocalização do seu navegador.';
  }
  return msg;
}

/**
 * Fluxos de relato do mapa. Os três caminhos (ponto crítico, local tocado, posição do aparelho) abrem o mesmo
 * formulário e enviam POST /api/reports, que cai na fila do operador. Também exporta CSV e obtém a localização.
 */
export function useFloodReporting({ notify }: Options) {
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const openReport = useCallback((target: ReportTarget) => {
    setReportError(null);
    setReportTarget(target);
  }, []);
  const closeReport = useCallback(() => setReportTarget(null), []);

  /** Abre o relato para um ponto crítico. */
  const openReportForPoint = useCallback((p: Pick<FloodPointResponseDTO, 'latitude' | 'longitude' | 'name'>) => openReport({ lat: p.latitude, lng: p.longitude, label: p.name }), [openReport]);
  /** Abre o relato para um local tocado no mapa. */
  const openReportAt = useCallback((c: { lat: number; lng: number }) => openReport({ lat: c.lat, lng: c.lng, label: 'O local que você tocou' }), [openReport]);

  const submitReport = useCallback(
    async (v: ReportFormValues) => {
      if (!reportTarget) return;
      setIsSubmittingReport(true);
      setReportError(null);
      try {
        await reportsService.create({
          latitude: reportTarget.lat,
          longitude: reportTarget.lng,
          observedAt: new Date().toISOString(),
          waterDepth: v.waterDepth,
          description: v.description,
        });
        notify('success', 'Relato enviado. Um operador vai conferir.');
        setReportTarget(null);
      } catch (error) {
        console.error('Erro ao enviar relato:', error);
        setReportError(actionErrorMessage(error, 'enviar o relato'));
      } finally {
        setIsSubmittingReport(false);
      }
    },
    [reportTarget, notify],
  );

  const handleExportCsv = useCallback(
    async (point: FloodPointResponseDTO) => {
      try {
        const csvData = await exportService.getUnifiedIADataCsv(point.slug);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `dataset_${point.slug}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        notify('error', 'Erro ao exportar dados para CSV.');
      }
    },
    [notify],
  );

  const handleGetGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      notify('error', 'Geolocalização não é suportada ou disponível neste navegador (verifique se está acessando via HTTPS ou localhost).');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsGettingLocation(false);
        openReport({ lat: latitude, lng: longitude, label: 'Sua posição' });
      },
      (error) => {
        console.warn('Erro de geolocalização:', error.message || 'Unknown error');
        setIsGettingLocation(false);
        notify('error', geolocationMessage(error));
      },
      { enableHighAccuracy: false, timeout: 15000 },
    );
  }, [notify, openReport]);

  return {
    reportTarget,
    reportError,
    isSubmittingReport,
    isGettingLocation,
    openReportForPoint,
    openReportAt,
    closeReport,
    submitReport,
    handleExportCsv,
    handleGetGeolocation,
  };
}
